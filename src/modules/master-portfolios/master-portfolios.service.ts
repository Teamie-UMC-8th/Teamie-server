import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QuestionType } from 'src/common/enums/question-type.enum';
import { PromptLoader } from 'src/common/utils/prompt.loader';
import { Questions } from './entities/questions.entity';
import { Repository } from 'typeorm';
import { MasterPortfolio } from './entities/master-portfolios.entity';
import {
    MasterPortfolioDuplicateException,
    MasterPortfolioNotFoundException,
} from 'src/common/exceptions/custom.errors';
import { UserMasterPortfoliosResponseDto } from './dtos/user-master-portfolios-response.dto';
import { PaginatedResponseDto } from 'src/common/response/paginated-response.dto';

export const QuestionResponseFormat = {
    type: 'json_object',
    schema: {
        type: 'object',
        properties: {
            questions: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        question: { type: 'string' },
                        questionType: {
                            type: 'string',
                            enum: QuestionType,
                            description: '질문 유형',
                        },
                    },
                    required: ['id', 'question', 'questionType'],
                },
            },
        },
        required: ['questions'],
    },
};

@Injectable()
export class MasterPortfoliosService {
    private apiKey?: string;
    private baseURL: string;
    constructor(
        @InjectRepository(Questions)
        private readonly questionsRepository: Repository<Questions>,
        @InjectRepository(MasterPortfolio)
        private readonly masterPortfolioRepository: Repository<MasterPortfolio>,
        private readonly promptLoader: PromptLoader
    ) {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.baseURL = process.env.OPENROUTER_API_BASE_URL || 'https://openrouter.ai/api/v1';
    }

    async createQuestions(userId: number, projectId: number) {
        // 프로젝트 ID로 마스터 포트폴리오를 찾습니다.
        const masterPortfolio = await this.masterPortfolioRepository.findOne({
            where: { project: { id: projectId }, user: { id: userId } },
        });
        if (!masterPortfolio) {
            throw new MasterPortfolioNotFoundException();
        }
        const masterPortfolioId = masterPortfolio.id;

        // 질문 생성 프롬프트를 로드합니다.
        let questionPrompt: string;
        try {
            questionPrompt = await this.promptLoader.load('question.prompt.md');
        } catch (e) {
            throw new Error('Failed to load question generation prompt');
        }

        const headers = {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
        };
        const completions = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model:
                    process.env.QUESTION_GENERATION_MODEL ||
                    'google/gemini-2.5-flash-lite-preview-06-17',
                messages: [
                    {
                        role: 'system',
                        content: questionPrompt,
                    },
                ],
                response_format: QuestionResponseFormat,
            }),
        });
        if (!completions.ok) {
            throw new Error(`Failed to create questions: ${completions.statusText}`);
        }
        const responseData = await completions.json();
        let questions: Array<{
            id: number;
            question: string;
            questionType: QuestionType;
        }>;
        try {
            const responseJsonData = JSON.parse(responseData.choices[0].message.content);
            questions = responseJsonData.questions;
        } catch (e) {
            // 별도 처리 필요
            throw new InternalServerErrorException(`Failed to parse response: ${e.message}`);
        }

        const questionEntities: Array<any> = [];
        for (const q of questions) {
            try {
                const questionEntity = this.questionsRepository.create({
                    questionId: q.id,
                    questionType: q.questionType,
                    question: q.question,
                    masterPortfolio: { id: masterPortfolioId },
                });
                const question = await this.questionsRepository.save(questionEntity);
                questionEntities.push({
                    questionId: question.questionId,
                    questionType: question.questionType,
                    question: question.question,
                });
            } catch (e) {
                console.error(`질문 생성 중 오류 발생: ${e.message}`);
                throw new InternalServerErrorException(`Failed to create question: ${e.message}`);
            }
        }
        console.log('저장된 질문들:', questionEntities);
        return questionEntities;
    }

    async createMasterPortfolio(userId: number, projectId: number) {
        const existingPortfolio = await this.masterPortfolioRepository.findOne({
            where: { user: { id: userId }, project: { id: projectId } },
        });
        if (existingPortfolio) {
            throw new MasterPortfolioDuplicateException(userId, projectId);
        }

        const masterPortfolio = this.masterPortfolioRepository.create({
            user: { id: userId },
            project: { id: projectId },
        });
        return this.masterPortfolioRepository.save(masterPortfolio);
    }

    //사용자 별 마스터 포트폴리오 조회
    async getMasterPortfoliosByUser(userId: number, cursorDate: Date, pageSize: number) {
        const portfolios = await this.masterPortfolioRepository
            .createQueryBuilder('mp')
            .leftJoin('mp.project', 'project')
            .addSelect([
                'mp.id',
                'mp.category',
                'mp.contributionRate',
                'mp.mainTask',
            ])
            .addSelect('project.name', 'name')
            .addSelect('project.createdAt', 'createdAt')
            .addSelect('project.completedAt', 'completedAt')
            .where('mp.userId = :userId', { userId })
            .andWhere('project.createdAt < :cursorDate', { cursorDate })
            .orderBy('project.createdAt', 'DESC')
            .take(pageSize + 1)
            .getRawMany();

        const hasNextPage: boolean = portfolios.length > pageSize;
        const nextCursor: string | null =
            portfolios.length > 0 && hasNextPage
                ? portfolios[portfolios.length - 1].createdAt.toISOString()
                : null;
        const result = portfolios
            .slice(0, pageSize)
            .map((entity) => UserMasterPortfoliosResponseDto.fromEntity(entity));
        return PaginatedResponseDto.of(result, nextCursor, hasNextPage);
    }
}
