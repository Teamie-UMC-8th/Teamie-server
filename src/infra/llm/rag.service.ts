import { TavilySearchAPIRetriever } from '@langchain/community/retrievers/tavily_search_api';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable } from '@nestjs/common';
import { RAGDataType } from 'src/common/enums/rag-data-type.enum';
import { PromptLoadingException } from 'src/common/exceptions/custom.errors';
import { PromptLoader } from 'src/common/utils/prompt.loader';
import { RAGData } from 'src/modules/portfolio-corrections/entities/rag-data.entity';
import { QueryRunner } from 'typeorm';
import { SearchQuery, searchQuerySchema } from './schemas/portfolio-correction.schema';
import { StringOutputParser } from '@langchain/core/output_parsers';

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
            temperature: 0.3,
            apiKey: this.apiKey,
            configuration: {
                baseURL: this.baseURL,
            },
        });

        this.ragLLM = new ChatOpenAI({
            model: process.env.RAG_MODEL || 'google/gemini-2.5-flash-lite-preview-06-17',
            temperature: 0.3,
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
        // step1. 검색어 추출
        const keywords = await this.extractSearchQuery(qr, correctionId);

        // step2. 검색어로 실시간 검색 api 호출
        const searchResults = await this.searchWithTavily(qr, correctionId, keywords);

        // step3. 검색 결과로 RAG 답변 생성
        return await this.generateCompanyInsights(searchResults);
    }

    // 키워드 추출
    private async extractSearchQuery(qr: QueryRunner, correctionId: number) {
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

        // TODO: 개수 제한 작동 안함. 프롬프트 개선하기
        const extractedQuery = await queryExtractionPrompt.pipe(queryExtractor).invoke({
            companyName: '레진코믹스',
            jobTitle: '글로벌 MD',
            jobDescription:
                '담당업무\n- 국내외 MD 유통 업체 관리\n- MD 수출 과정 핸들링\n-> 오더 주문, 수금, 발주, 출고 등 관리\n-> 서류 통관 인허가, 면장 등\n- 공급 매출 정산 업무 (ERP 시스템 판매 정보 및 결산)\n\n자격요건\n- 영어 비즈니스 커뮤니케이션이 가능하신 분\n- K-POP, 웹툰IP의 이해도를 가지고 계신 분\n- 문서 프로그램 엑셀 활용 능력이 높으신 분\n- 대내/외 원활한 소통 능력을 갖추신 분\n\n우대요건\n- 주도적인 목표 수립과 실행력을 보유하신 분\n- 여성향 장르 웹툰에 대한 이해도가 높으신 분\n- 대중적인 트렌드에 민감하고 시장 트렌드 분석이 가능하신 분\n- 팀워크를 중시하며 긍정적인 커뮤니케이션 마인드를 보유하신 분\n- 팬덤 비즈니스에 대한 높은 이해도를 보유하신 분\n- ERP, 상급 수준의 MS Office 활용, 도구 툴 활용이 가능하신 분 (Excel, Power Point 등)\n- 해외 출장 업무에 거부감이 없으신 분',
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
        combinedResults.forEach(async (result) => {
            const title = result.metadata.title;
            const link = result.metadata.source;
            await qr.manager.save(RAGData, {
                portfolioCorrection: { id: correctionId },
                type: RAGDataType.LINK,
                link,
                title,
            });

            searchResults.push(result.pageContent);
        });
        return searchResults;
    }

    // 기업 분석 정보 생성
    private async generateCompanyInsights(searchResults: string[]) {
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
