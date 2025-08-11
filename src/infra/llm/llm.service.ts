import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Question } from '../../common/types/question.type';
import { QuestionResponseFormat } from './formats/question-response.format';
import { PromptLoader } from 'src/common/utils/prompt.loader';
import { MasterPortfolioResponseFormat } from './formats/master-portfolio-response.format';
import { MasterPortfolioOutput } from 'src/common/types/master-portfolio.type';
import { PromptLoadingException } from 'src/common/exceptions/custom.errors';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { OutputParserException, StructuredOutputParser } from '@langchain/core/output_parsers';
import { Correction, correctionSchema } from './schemas/portfolio-correction.schema';
import { QueryRunner } from 'typeorm';
import { PortfolioCorrection } from 'src/modules/portfolio-corrections/entities/portfolio-correction.entity';
import { Questions, questionSchema } from './schemas/questions.schema';
import { MasterPortfolio, masterPortfolioSchema } from './schemas/master-portfolio.schema';

function processLLMError(error: any) {
    // JSON 파싱 실패
    if (error.constructor.name === 'OutputParserException') {
        throw new InternalServerErrorException(`JSON 파싱에 실패했습니다. ${error.message}`);
    }

    // SyntaxError
    if (error.constructor.name === 'SyntaxError') {
        throw new InternalServerErrorException(`LLM 응답이 이상한 형태입니다. ${error.message}`);
    }

    // Zod 스키마 검증 에러
    if (error.name === 'ZodError') {
        throw new InternalServerErrorException(
            `생성된 결과의 형식이 올바르지 않습니다. ${error.message}`
        );
    }

    // OpenRouter API 에러 코드별 처리
    if (error.status) {
        switch (error.status) {
            case 400:
                throw new InternalServerErrorException('잘못된 요청입니다.');
            case 401:
                throw new InternalServerErrorException(
                    'API 인증에 실패했습니다. API 키를 확인하세요.'
                );
            case 402:
                throw new InternalServerErrorException(
                    'API 크레딧이 부족합니다. 충전 후 다시 시도하세요.'
                );
            case 403:
                throw new InternalServerErrorException('입력이 정책에 의해 차단되었습니다.');
            case 408:
                throw new InternalServerErrorException(
                    '요청 시간이 초과되었습니다. 잠시 후 다시 시도하세요.'
                );
            case 429:
                throw new InternalServerErrorException(
                    '요청이 너무 많아 제한되었습니다. 잠시 후 다시 시도하세요.'
                );
            case 502:
                throw new InternalServerErrorException(
                    '모델 서버에 문제가 있습니다. 잠시 후 다시 시도하세요.'
                );
            case 503:
                throw new InternalServerErrorException(
                    '사용 가능한 모델이 없습니다. 잠시 후 다시 시도하세요.'
                );
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
            temperature: 0.3,
            apiKey: this.apiKey,
            configuration: {
                baseURL: this.baseURL,
            },
        });

        this.masterPortfolioLLM = new ChatOpenAI({
            model:
                process.env.LLM_MASTER_PORTFOLIO_MODEL ||
                'google/gemini-2.5-flash-lite-preview-06-17',
            temperature: 0.3,
            apiKey: this.apiKey,
            configuration: {
                baseURL: this.baseURL,
            },
        });

        this.correctionLLM = new ChatOpenAI({
            model: process.env.LLM_CORRECTION_MODEL || 'google/gemini-2.5-flash-lite-preview-06-17',
            temperature: 0.3,
            apiKey: this.apiKey,
            configuration: {
                baseURL: this.baseURL,
            },
        });
    }

    async generateQuestions(inputData: string): Promise<Array<Question>> {
        // 질문 생성 프롬프트를 로드합니다.
        let questionPromptText: string;
        try {
            questionPromptText = await this.promptLoader.load('question.prompt.md');
        } catch (e) {
            throw new PromptLoadingException('question.prompt.md');
        }

        const questionPrompt = ChatPromptTemplate.fromTemplate(questionPromptText);
        const structuredLLM = this.questionLLM.withStructuredOutput<Questions>(questionSchema, {
            name: 'questions',
        });

        try {
            // 실패 테스트용(옵션): 타입 과심화 방지를 위해 any 캐스팅 사용
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
                throw new InternalServerErrorException(
                    'LLM에서 유효한 질문 구조를 생성하지 못했습니다.'
                );
            }
            if (questions.questions.length === 0) {
                throw new InternalServerErrorException('LLM에서 질문을 생성하지 못했습니다.');
            }

            return questions.questions.map((q) => ({
                ...q,
                questionType: q.questionType as Question['questionType'],
            }));
        } catch (error) {
            // 각종 에러 체크
            processLLMError(error);

            // 이외의 모든 에러
            throw new InternalServerErrorException(
                `질문 생성 중 알 수 없는 오류가 발생했습니다. [${error?.constructor?.name}] ${error}`
            );
        }
    }

    // 마스터 포트폴리오 AI 생성
    async generateMasterPortfolio(questionData: any, projectData: string) {
        // 마스터 포트폴리오 프롬프트를 로드합니다.
        let masterPortfolioPromptText: string;
        try {
            masterPortfolioPromptText = await this.promptLoader.load('master-portfolio.prompt.md');
        } catch (e) {
            throw new PromptLoadingException('master-portfolio.prompt.md');
        }

        const masterPortfolioPrompt = ChatPromptTemplate.fromTemplate(masterPortfolioPromptText);
        const structuredLLM = this.masterPortfolioLLM.withStructuredOutput<MasterPortfolio>(
            masterPortfolioSchema,
            {
                name: 'masterPortfolio',
            }
        );

        try {
            const masterPortfolioResult = await masterPortfolioPrompt.pipe(structuredLLM).invoke({
                questionData: questionData,
                projectData: projectData,
            });

            // 출력 실패
            if (
                !masterPortfolioResult ||
                !masterPortfolioResult.detailInfo ||
                !masterPortfolioResult.assignedTask ||
                !masterPortfolioResult.keyAchievement ||
                !masterPortfolioResult.insight
            ) {
                throw new InternalServerErrorException(
                    'LLM에서 유효한 마스터 포트폴리오 구조를 생성하지 못했습니다.'
                );
            }

            return masterPortfolioResult;
        } catch (error) {
            // 각종 에러 체크
            processLLMError(error);

            // 이외의 모든 에러
            throw new InternalServerErrorException(
                `마스터 포트폴리오 생성 중 알 수 없는 오류가 발생했습니다. [${error?.constructor?.name}] ${error}`
            );
        }
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
}
