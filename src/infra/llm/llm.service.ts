import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Question } from '../../common/types/question.type';
import { QuestionResponseFormat } from './formats/question-response.format';
import { PromptLoader } from 'src/common/utils/prompt.loader';
import { MasterPortfolioResponseFormat } from './formats/master-portfolio-response.format';
import { MasterPortfolioOutput } from 'src/common/types/master-portfolio.type';
import { PromptLoadingException } from 'src/common/exceptions/custom.errors';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Correction, correctionSchema } from './schemas/portfolio-correction.schema';
import { QueryRunner } from 'typeorm';
import { PortfolioCorrection } from 'src/modules/portfolio-corrections/entities/portfolio-correction.entity';

@Injectable()
export class LLMService {
    private apiKey?: string;
    private baseURL: string;
    private correctionLLM: ChatOpenAI;

    constructor(private readonly promptLoader: PromptLoader) {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.baseURL = process.env.OPENROUTER_API_BASE_URL || 'https://openrouter.ai/api/v1';

        this.correctionLLM = new ChatOpenAI({
            model: process.env.LLM_CORRECTION_MODEL || 'google/gemini-2.5-flash-lite-preview-06-17',
            temperature: 0.3,
            apiKey: this.apiKey,
            configuration: {
                baseURL: this.baseURL,
            },
        });
    }

    // 실제 LLM 호출을 처리하는 메소드
    async generate(
        model: string,
        messages: Array<{ role: string; content: string }>,
        responseFormat: object
    ) {
        const headers = {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
        };

        const completions = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model,
                messages,
                response_format: responseFormat,
            }),
        });
        if (!completions.ok) {
            const errorText = await completions.text();
            throw new InternalServerErrorException(
                `LLM API 호출 실패: ${completions.status} - ${errorText}`
            );
        }
        return completions;
    }

    async generateQuestions(inputData: string): Promise<Array<Question>> {
        // 질문 생성 프롬프트를 로드합니다.
        let questionPrompt: string;
        try {
            questionPrompt = await this.promptLoader.load('question.prompt.md');
        } catch (e) {
            throw new PromptLoadingException('question.prompt.md');
        }

        const model =
            process.env.QUESTION_GENERATION_MODEL || 'google/gemini-2.5-flash-lite-preview-06-17';
        const messages = [
            {
                role: 'system',
                content: questionPrompt,
            },
        ];

        const completions = await this.generate(model, messages, QuestionResponseFormat);
        const responseData = await completions.json();
        let questions: Array<Question>;

        try {
            const responseJsonData = JSON.parse(responseData.choices[0].message.content);
            questions = responseJsonData.questions;
        } catch (e) {
            // 별도 처리 필요
            throw new InternalServerErrorException(`Failed to parse response: ${e.message}`);
        }

        return questions;
    }

    // 마스터 포트폴리오 AI 생성
    async generateMasterPortfolio(projectData: any) {
        let masterPortfolioPrompt: string;
        try {
            masterPortfolioPrompt = await this.promptLoader.load('master-portfolio.prompt.md');
            projectData = await this.promptLoader.load('dummy-input.json');
        } catch (e) {
            throw new PromptLoadingException('master-portfolio.prompt.md');
        }
        masterPortfolioPrompt = masterPortfolioPrompt.replace(
            '{project_data}',
            JSON.stringify(projectData, null, 4)
        );

        const model =
            process.env.MASTER_PORTFOLIO_MODEL || 'google/gemini-2.5-flash-lite-preview-06-17';
        const messages = [
            {
                role: 'system',
                content: masterPortfolioPrompt,
            },
        ];

        const completions = await this.generate(model, messages, MasterPortfolioResponseFormat);
        const responseData = await completions.json();
        let responseJsonData: MasterPortfolioOutput;

        try {
            responseJsonData = JSON.parse(responseData.choices[0].message.content);
        } catch (e) {
            // 별도 처리 필요 (파싱 에러가 발생하면 이 에러가 발생함. Bad control character in string literal in JSON at position ~)
            throw new InternalServerErrorException(`Failed to parse response: ${e.message}`);
        }

        return responseJsonData;
    }

    // AI 첨삭 생성
    async generateCorrection(qr: QueryRunner, correctionId: number, portfolioData: any) {
        const portfolioCorrectionData = await qr.manager.findOne(PortfolioCorrection, {
            where: { id: correctionId },
        });
        if (!portfolioCorrectionData) {
            throw new InternalServerErrorException(
                `포트폴리오 첨삭이 존재하지 않습니다. ID: ${correctionId}`
            );
        }

        let correctionPromptText: string;
        try {
            correctionPromptText = await this.promptLoader.load('portfolio-correction.prompt.md');
        } catch (e) {
            throw new PromptLoadingException('portfolio-correction.prompt.md');
        }
        const correctionPrompt = ChatPromptTemplate.fromTemplate(correctionPromptText);

        const structuredLLM = this.correctionLLM.withStructuredOutput<Correction>(
            correctionSchema,
            {
                name: 'correction',
            }
        );
        const correctionResult = await correctionPrompt.pipe(structuredLLM).invoke({
            companyName: portfolioCorrectionData.submissionTarget,
            jobTitle: portfolioCorrectionData.jobTitle,
            jobDescription: portfolioCorrectionData.jd,
            companyInsight: portfolioCorrectionData.companyInsight,
            portfolioData: portfolioData,
        });

        return correctionResult;
    }

    // TODO: 추후 SSE 방식 도입 필요
    async startRAG(qr: QueryRunner, correctionId: number) {
        // step1. 검색어 추출
        const keywords = await this.extractSearchQuery(qr, correctionId);

        // step2. 검색어로 실시간 검색 api 호출
        const searchResults = await this.searchWithTavily(qr, correctionId, keywords);

        // step3. 검색 결과로 RAG 답변 생성
        return await this.generateRAGAnswer(searchResults);
    }

    async extractSearchQuery(qr: QueryRunner, correctionId: number) {
        let queryExtractionText: string;
        try {
            queryExtractionText = await this.promptLoader.load('keyword-extract.prompt.md');
        } catch (e) {
            throw new PromptLoadingException('keyword-extract.prompt.md');
        }
        const queryExtractionPrompt = ChatPromptTemplate.fromTemplate(queryExtractionText);

        const queryExtractor = this.queryLLM.withStructuredOutput<SearchQuery>(searchQuerySchema, {
            name: 'searchQuery',
        });

        const correctionData = await qr.manager.findOne(PortfolioCorrection, {
            where: { id: correctionId },
            select: ['submissionTarget', 'jobTitle', 'jd'],
        });

        // TODO: 개수 제한 작동 안함. 프롬프트 개선하기
        const extractedQuery = await queryExtractionPrompt.pipe(queryExtractor).invoke({
            companyName: correctionData?.submissionTarget,
            jobTitle: correctionData?.jobTitle,
            jobDescription: correctionData?.jd,
            k: 2,
        });

        const queryList = extractedQuery.query.split(',').map((q) => q.trim());

        queryList.forEach(async (query) => {
            await qr.manager.save(RAGData, {
                portfolioCorrection: { id: correctionId },
                type: RAGDataType.KEYWORD,
                keyword: query,
            });
        });

        return queryList;
    }

    async searchWithTavily(qr: QueryRunner, correctionId: number, keywords: string[]) {
        const searchPromises = keywords.map(async (query) => {
            const results = await this.retriever.invoke(query);
            return {
                query,
                results,
                count: results.length,
            };
        });

        const allResults = await Promise.all(searchPromises);
        const combinedResults = allResults.flatMap((result) => result.results);

        // TODO: metadata의 score 활용해서 점수 기반 정렬 등의 작업
        const searchResults: string[] = [];
        combinedResults.forEach(async (result, index) => {
            const title = result.metadata.title;
            const link = result.metadata.source;
            await qr.manager.save(RAGData, {
                portfolioCorrection: { id: correctionId },
                type: RAGDataType.LINK,
                link,
            });

            searchResults.push(result.pageContent);
        });
        return searchResults;
    }

    async generateRAGAnswer(searchResults: string[]) {
        // RAG 답변 생성을 위한 로직 구현
        let companyProfilePromptText: string;
        try {
            companyProfilePromptText = await this.promptLoader.load('company-profile.prompt.md');
        } catch (e) {
            throw new PromptLoadingException('company-profile.prompt.md');
        }
        const companyProfilePrompt = ChatPromptTemplate.fromTemplate(companyProfilePromptText);

        const companyProfile = await companyProfilePrompt
            .pipe(this.ragLLM)
            .pipe(new StringOutputParser())
            .invoke({
                pageContents: searchResults,
            });
        return companyProfile;
    }
}
