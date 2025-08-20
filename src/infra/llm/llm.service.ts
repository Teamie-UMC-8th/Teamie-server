import { Injectable } from '@nestjs/common';
import { Question } from '../../common/types/question.type';
import { PromptLoader } from 'src/common/utils/prompt.loader';
import {
    FailJSONParseException,
    LLMGenerateQuestionFailedException,
    LLMIncludesEmptyException,
    LLMSyntaxErrorException,
    LLMUnknownGenerateErrorException,
    LLMZodErrorException,
    MasterPortfolioAIResultNotValidException,
    PortfolioCorrectionNotFoundException,
    PromptLoadingException,
    APIBadRequestException,
    APIUnauthorizedException,
    APIPaymentRequiredException,
    APIForbiddenException,
    APITimeoutException,
    APITooManyRequestsException,
    APIBadGatewayException,
    APIServiceUnavailableException,
} from 'src/common/exceptions/custom.errors';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { OutputParserException, StructuredOutputParser } from '@langchain/core/output_parsers';
import { Correction, correctionSchema } from './schemas/portfolio-correction.schema';
import { QueryRunner } from 'typeorm';
import { PortfolioCorrection } from 'src/modules/portfolio-corrections/entities/portfolio-correction.entity';
import { Questions, questionSchema } from './schemas/questions.schema';
import { MasterPortfolio, masterPortfolioSchema } from './schemas/master-portfolio.schema';
import { ProjectData } from 'src/modules/master-portfolios/types/project-data.interface';
import { ResponseDelayManager } from 'src/common/utils/response-delay.util';
import { checkMasterPortfolioContentStructure } from 'src/common/utils/check-masterportfolio-structure.util';
import { PromptManager } from 'src/common/utils/prompt.util';

function processLLMError(error: any) {
    // JSON 파싱 실패
    if (error.constructor.name === 'OutputParserException') {
        throw new FailJSONParseException(error.message);
    }

    // SyntaxError
    if (error.constructor.name === 'SyntaxError') {
        throw new LLMSyntaxErrorException(`${error.message}`);
    }

    // Zod 스키마 검증 에러
    if (error.name === 'ZodError') {
        throw new LLMZodErrorException(`${error.message}`);
    }

    // OpenRouter API 에러 코드별 처리
    if (error.status) {
        switch (error.status) {
            case 400:
                throw new APIBadRequestException();
            case 401:
                throw new APIUnauthorizedException();
            case 402:
                throw new APIPaymentRequiredException();
            case 403:
                throw new APIForbiddenException();
            case 408:
                throw new APITimeoutException();
            case 429:
                throw new APITooManyRequestsException();
            case 502:
                throw new APIBadGatewayException();
            case 503:
                throw new APIServiceUnavailableException();
        }
    }
}

@Injectable()
export class LLMService {
    private apiKey?: string;
    private baseURL: string;
    private correctionLLM: ChatOpenAI;
    private questionLLM: ChatOpenAI;
    private masterPortfolioLLM: ChatOpenAI;

    constructor(private readonly promptLoader: PromptLoader) {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.baseURL = process.env.OPENROUTER_API_BASE_URL || 'https://openrouter.ai/api/v1';

        this.questionLLM = new ChatOpenAI({
            model: process.env.LLM_QUESTION_MODEL || 'google/gemini-2.5-flash-lite-preview-06-17',
            temperature: parseFloat(process.env.LLM_QUESTION_TEMPERATURE || '0.3'),
            apiKey: this.apiKey,
            configuration: {
                baseURL: this.baseURL,
            },
        });

        this.masterPortfolioLLM = new ChatOpenAI({
            model:
                process.env.LLM_MASTER_PORTFOLIO_MODEL ||
                'google/gemini-2.5-flash-lite-preview-06-17',
            temperature: parseFloat(process.env.LLM_MASTER_PORTFOLIO_TEMPERATURE || '0.3'),
            apiKey: this.apiKey,
            configuration: {
                baseURL: this.baseURL,
            },
        });

        this.correctionLLM = new ChatOpenAI({
            model: process.env.LLM_CORRECTION_MODEL || 'google/gemini-2.5-flash-lite-preview-06-17',
            temperature: parseFloat(process.env.LLM_CORRECTION_TEMPERATURE || '0.3'),
            apiKey: this.apiKey,
            configuration: {
                baseURL: this.baseURL,
            },
        });
    }

    async generateQuestions(inputData: string): Promise<Array<Question>> {
        // 질문 생성 프롬프트를 로드합니다.
        const questionPrompt = await PromptManager.getPrompt(
            this.promptLoader,
            'question.prompt.md'
        );

        const structuredLLM = this.questionLLM.withStructuredOutput<Questions>(questionSchema, {
            name: 'questions',
        });

        try {
            // 실패 테스트용: 타입 과심화 방지를 위해 any 캐스팅 사용
            // const zodSchema = z.object({
            //     name: z.string().describe('배우의 이름'),
            //     films: z.array(z.string()).describe('출연 영화 목록'),
            // });
            // const malformedOutput = "{'name': 'Tom Hanks', 'films': ['Forrest Gump']}";
            // const parser = (StructuredOutputParser as any).fromZodSchema(zodSchema as any) as any;
            // await parser.parse(malformedOutput);

            const questions = await questionPrompt.pipe(structuredLLM).invoke({
                userData: inputData,
            });

            // 구조화된 출력 실패
            if (!questions || !questions.questions || !Array.isArray(questions.questions)) {
                throw new LLMGenerateQuestionFailedException('유효한 질문 구조가 아님.');
            }
            if (questions.questions.length === 0) {
                throw new LLMGenerateQuestionFailedException('아무 질문도 생성되지 않음.');
            }

            return questions.questions.map((q) => ({
                ...q,
                questionType: q.questionType as Question['questionType'],
            }));
        } catch (error) {
            // 각종 에러 체크
            processLLMError(error);

            // 이외의 모든 에러
            throw new LLMUnknownGenerateErrorException(
                `(질문) [${error?.constructor?.name}] ${error}`
            );
        }
    }

    // 마스터 포트폴리오 AI 생성
    async generateMasterPortfolio(questionData: any, projectData: ProjectData) {
        // 마스터 포트폴리오 프롬프트를 로드합니다.
        const masterPortfolioPrompt = await PromptManager.getPrompt(
            this.promptLoader,
            'master-portfolio.prompt.md'
        );

        const structuredLLM = this.masterPortfolioLLM.withStructuredOutput<MasterPortfolio>(
            masterPortfolioSchema,
            {
                name: 'masterPortfolio',
            }
        );

        const operation = async () => {
            try {
                const masterPortfolioResult = await masterPortfolioPrompt
                    .pipe(structuredLLM)
                    .invoke({
                        questionData: questionData,
                        projectData: projectData,
                    });

                console.log(masterPortfolioResult);
                // 출력 실패
                if (
                    !masterPortfolioResult ||
                    !masterPortfolioResult.detailInfo ||
                    !masterPortfolioResult.assignedTask ||
                    !masterPortfolioResult.keyAchievement ||
                    !masterPortfolioResult.insight
                ) {
                    throw new LLMIncludesEmptyException();
                }

                // 생성된 JSON 값 구조 검사
                const checkResult = checkMasterPortfolioContentStructure(masterPortfolioResult);
                const isValid = Object.values(checkResult).every((value) => value === true);
                if (!isValid) {
                    throw new MasterPortfolioAIResultNotValidException();
                }

                return masterPortfolioResult;
            } catch (error) {
                // 각종 에러 체크
                processLLMError(error);

                // 이외의 모든 에러
                throw new LLMUnknownGenerateErrorException(
                    `(마스터 포트폴리오) [${error?.constructor?.name}] ${error}`
                );
            }
        };
        return ResponseDelayManager.ensureMinimumDuration(operation());
    }

    // AI 첨삭 생성
    async generateCorrection(qr: QueryRunner, correctionId: number, portfolioData: any) {
        const portfolioCorrectionData = await qr.manager.findOne(PortfolioCorrection, {
            where: { id: correctionId },
        });
        if (!portfolioCorrectionData) {
            throw new PortfolioCorrectionNotFoundException(correctionId);
        }

        const correctionPrompt = await PromptManager.getPrompt(
            this.promptLoader,
            'portfolio-correction.prompt.md'
        );

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
}
