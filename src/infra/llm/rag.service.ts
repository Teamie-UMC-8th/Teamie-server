import { TavilySearchAPIRetriever } from '@langchain/community/retrievers/tavily_search_api';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { RAGDataType } from 'src/common/enums/rag-data-type.enum';
import {
    PortfolioCorrectionNotFoundException,
    PromptLoadingException,
    RAGAlreadyExistsException,
} from 'src/common/exceptions/custom.errors';
import { PromptLoader } from 'src/common/utils/prompt.loader';
import { RAGData } from 'src/modules/portfolio-corrections/entities/rag-data.entity';
import { QueryRunner } from 'typeorm';
import { SearchKeywords, searchKeywordsSchema } from './schemas/portfolio-correction.schema';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PortfolioCorrection } from 'src/modules/portfolio-corrections/entities/portfolio-correction.entity';
import { PromptManager } from 'src/common/utils/prompt.util';

@Injectable()
export class RagService {
    private apiKey?: string;
    private baseURL: string;
    private queryLLM: ChatOpenAI;
    private ragLLM: ChatOpenAI;
    private retriever: TavilySearchAPIRetriever;

    constructor(private readonly promptLoader: PromptLoader) {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.baseURL = process.env.OPENROUTER_API_BASE_URL || 'https://openrouter.ai/api/v1';

        this.queryLLM = new ChatOpenAI({
            model:
                process.env.QUERY_GENERATION_MODEL || 'google/gemini-2.5-flash-lite-preview-06-17',
            temperature: parseFloat(process.env.LLM_QUERY_TEMPERATURE || '0.3'),
            apiKey: this.apiKey,
            configuration: {
                baseURL: this.baseURL,
            },
        });

        this.ragLLM = new ChatOpenAI({
            model: process.env.RAG_MODEL || 'google/gemini-2.5-flash-lite-preview-06-17',
            temperature: parseFloat(process.env.LLM_RAG_TEMPERATURE || '0.3'),
            apiKey: this.apiKey,
            configuration: {
                baseURL: this.baseURL,
            },
        });

        this.retriever = new TavilySearchAPIRetriever({
            apiKey: process.env.TAVILY_API_KEY,
            searchDepth: 'advanced',
            k: parseInt(process.env.REQUIRED_RESULTS_COUNT || '2', 10),
        });
    }

    // TODO: 추후 SSE 방식 도입 필요
    async startRAG(qr: QueryRunner, correctionId: number) {
        // 이미 진행되었는지 여부 확인
        const status = await qr.manager.findOne(PortfolioCorrection, {
            where: { id: correctionId },
            select: ['status'],
        });
        // 이미 진행된 상태인 경우, RAG 프로세스 중단
        if (status && (status.status === 'DONE' || status.status === 'COMPANY_INSIGHT')) {
            throw new RAGAlreadyExistsException();
        }

        // step1. 검색어 추출
        const keywords = await this.extractSearchQuery(qr, correctionId);

        // step2. 검색어로 실시간 검색 api 호출
        const searchResults = await this.searchWithTavily(qr, correctionId, keywords);

        // step3. 검색 결과로 RAG 답변 생성
        return await this.generateCompanyInsights(qr, correctionId, searchResults);
    }

    // 키워드 추출
    private async extractSearchQuery(qr: QueryRunner, correctionId: number): Promise<string[]> {
        const queryExtractionPrompt = await PromptManager.getPrompt(
            this.promptLoader,
            'keyword-extract.prompt.md'
        );

        const queryExtractor = this.queryLLM.withStructuredOutput<SearchKeywords>(
            searchKeywordsSchema,
            {
                name: 'searchKeywords',
            }
        );

        const inputData = await qr.manager.findOne(PortfolioCorrection, {
            where: { id: correctionId },
        });
        if (!inputData) {
            throw new PortfolioCorrectionNotFoundException(correctionId);
        }

        // 실행 (최대 3번 재시도)
        const maxRetries = 3;
        let lastError: Error;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const extractedQuery = await queryExtractionPrompt.pipe(queryExtractor).invoke({
                    companyName: inputData.submissionTarget,
                    jobTitle: inputData.jobTitle,
                    jobDescription: inputData.jd,
                });
                const queryList = extractedQuery.search_keywords;

                if (!Array.isArray(queryList) || queryList.length !== 4) {
                    throw new InternalServerErrorException('검색어 추출 결과가 유효하지 않습니다.');
                }

                // 키워드 DB에 저장
                queryList.forEach(async (query) => {
                    await qr.manager.save(RAGData, {
                        portfolioCorrection: { id: correctionId },
                        type: RAGDataType.KEYWORD,
                        keyword: query,
                    });
                });

                return queryList;
            } catch (error) {
                lastError = error as Error;
                console.error(`[키워드 추출] 시도 ${attempt} 실패:`, error);

                if (attempt === maxRetries) {
                    console.error('모든 재시도 실패. 최종 에러:', lastError);
                    throw new InternalServerErrorException('검색어 추출에 실패했습니다.');
                }

                // 재시도 전 잠시 대기
                await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
            }
        }

        // 타입 안전성을 위해 모든 경로에서 반환 또는 예외가 발생하도록 보장
        throw new InternalServerErrorException('검색어 추출에 실패했습니다.');
    }

    // 실시간 검색 api 사용
    private async searchWithTavily(qr: QueryRunner, correctionId: number, keywords: string[]) {
        // Tavily API 호출을 위한 로직
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
        await Promise.all(
            combinedResults.map(async (result) => {
                const title = result.metadata.title;
                const link = result.metadata.source;
                await qr.manager.save(RAGData, {
                    portfolioCorrection: { id: correctionId },
                    type: RAGDataType.LINK,
                    link,
                    title,
                });

                searchResults.push(result.pageContent);
            })
        );
        return searchResults;
    }

    // 기업 분석 정보 생성
    private async generateCompanyInsights(
        qr: QueryRunner,
        correctionId: number,
        searchResults: string[]
    ) {
        // RAG 답변 생성을 위한 로직 구현
        const companyProfilePrompt = await PromptManager.getPrompt(
            this.promptLoader,
            'company-profile.prompt.md'
        );

        const info = await qr.manager.findOne(PortfolioCorrection, {
            where: { id: correctionId },
            select: ['submissionTarget', 'jobTitle'],
        });
        if (!info) {
            throw new PortfolioCorrectionNotFoundException(
                correctionId,
                '회사명/직무명 데이터를 조회하는데 실패했습니다.'
            );
        }

        const companyProfile = await companyProfilePrompt
            .pipe(this.ragLLM)
            .pipe(new StringOutputParser())
            .invoke({
                companyName: info.submissionTarget,
                jobTitle: info.jobTitle,
                pageContents: searchResults,
            });
        return companyProfile;
    }
}
