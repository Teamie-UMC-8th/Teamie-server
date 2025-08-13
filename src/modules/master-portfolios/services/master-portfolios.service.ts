import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Questions } from '../entities/questions.entity';
import { In, QueryRunner, Repository } from 'typeorm';
import { MasterPortfolio } from '../entities/master-portfolios.entity';
import { LLMService } from 'src/infra/llm/llm.service';
import { Question } from 'src/common/types/question.type';
import { MasterPortfolioOutput } from 'src/common/types/master-portfolio.type';
import {
    MasterPortfolioDetailResponseDto,
    MasterPortfolioResponseDto,
} from '../dtos/master-portfolio-response.dto';
import {
    AIGenerationAlreadyExists,
    InvalidQuestionTypeException,
    MasterPortfolioAIGenerateFailException,
    MasterPortfolioAINotFoundException,
    MasterPortfolioDuplicateException,
    MasterPortfolioNotFoundException,
    MasterPortfolioSaveFailException,
    ProjectNotFoundException,
    QuestionGenerationException,
    QuestionNotFoundException,
    QuestionUpdateException,
} from 'src/common/exceptions/custom.errors';
import { QuestionResponseDto, UpdateQuestionDto } from '../dtos/question.dto';
import { QuestionType } from 'src/common/enums/question-type.enum';
import { MasterPortfolioRequestDto } from '../dtos/master-portfolio-request.dto';
import { UserMasterPortfoliosResponseDto } from '../dtos/user-master-portfolios-response.dto';
import { PaginatedResponseDto } from 'src/common/response/paginated-response.dto';
import { MasterPortfolioAI } from '../entities/master-portfolio-ai.entity';
import { MasterPortfolioAIResponseDto } from '../dtos/master-portfolio-ai-response.dto';
import { Task } from '../../tasks/entities/tasks.entity';
import { Plan } from '../../plans/entities/plan.entity';
import { PersonalRecall } from '../../personal-recalls/entities/personal-recalls.entity';
import { portfolioType } from 'src/common/enums/portfolio-type.enum';
import { Project } from '../../projects/entities/projects.entity';
import { EntityManager } from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { UserProject } from '../../projects/user-projects/entities/user-projects.entity';
import { SelectablePlanResponseDto } from '../dtos/selectable-plan.dto';
import { MasterPortfolioStatus } from 'src/common/enums/master-portfolio-status.enum';
import { getPeriod } from 'src/common/utils/get-period';
import { ProjectData } from '../types/project-data.interface';
import { checkMasterPortfolioContentStructure } from 'src/common/utils/check-masterportfolio-structure.util';

async function getProjectData(
    qr: QueryRunner,
    userId: number,
    masterPortfolioId: number,
    projectId: number,
    recordIdList?: number[]
) {
    // 1. 선택된 회의록 내용
    let records: any[];
    if (!recordIdList) {
        const plans = await qr.manager.find(Plan, {
            where: { masterPortfolioId: masterPortfolioId, project: { id: projectId } },
            select: ['name', 'meetingRecords'],
        });
        records = plans.map((plan) => ({
            name: plan.name,
            meetingRecords: plan.meetingRecords,
        }));
    } else {
        records = await qr.manager.find(Plan, {
            where: { id: In(recordIdList) },
            select: ['name', 'meetingRecords'],
        });
    }
    // 2. 담당자로 지정된 모든 업무명
    const tasks = await qr.manager.find(Task, {
        where: { managers: { user: { id: userId } }, step: { project: { id: projectId } } },
        select: ['name'],
    });
    // 3. 개인회고 내용
    const personalRecall = await qr.manager.findOne(PersonalRecall, {
        where: { user: { id: userId }, project: { id: projectId } },
        select: ['id', 'collaborationProfile', 'memorableExperience', 'strengthsAndGrowth'],
    });
    // 4. 프로젝트명, 진행기간
    const projectInfo = await qr.manager.findOne(Project, {
        where: { id: projectId },
        select: ['createdAt', 'completedAt', 'name'],
    });
    if (!projectInfo) {
        throw new ProjectNotFoundException(`ID가 ${projectId}인 프로젝트를 찾을 수 없습니다.`);
    }
    const projectName: string = projectInfo.name; // 프로젝트명
    const createdAt: Date = projectInfo.createdAt; // 2025-07-26T06:05:35.998Z, Date 객체
    const completedAt: Date = projectInfo.completedAt || new Date(); // 완료일이 없으면 현재 시간으로 설정
    const projectPeriod: string = getPeriod(createdAt, completedAt);

    // 5. 분류 태그, 기여도
    const masterPortfolioData = await qr.manager.findOne(MasterPortfolio, {
        where: { id: masterPortfolioId },
        select: ['category', 'contributionRate'],
    });
    if (!masterPortfolioData) {
        throw new MasterPortfolioNotFoundException(
            `ID가 ${masterPortfolioId}인 마스터 포트폴리오를 찾을 수 없습니다.`
        );
    }
    const category: portfolioType = masterPortfolioData.category;
    const contributionRate: number = masterPortfolioData.contributionRate;

    // 6. 이름과 역할(role)
    const userName = await qr.manager.findOne(User, {
        where: { id: userId },
        select: ['name'],
    });
    const role = await qr.manager.findOne(UserProject, {
        where: { user: { id: userId }, project: { id: projectId } },
        select: ['id', 'role'],
    });

    return {
        records,
        tasks,
        personalRecall,
        projectName,
        category,
        contributionRate,
        userName: userName?.name || '',
        role: role?.role || '',
        projectPeriod,
    };
}

@Injectable()
export class MasterPortfoliosService {
    constructor(
        @InjectRepository(Questions)
        private readonly questionsRepository: Repository<Questions>,
        @InjectRepository(MasterPortfolio)
        private readonly masterPortfolioRepository: Repository<MasterPortfolio>,
        @InjectRepository(MasterPortfolioAI)
        private readonly masterPortfolioAIRepository: Repository<MasterPortfolioAI>,
        @InjectRepository(Plan)
        private readonly planRepository: Repository<Plan>,
        private readonly llmService: LLMService
    ) {}

    // 마스터 포트폴리오 질문 생성
    async createQuestions(
        qr: QueryRunner,
        userId: number,
        portfolioId: number,
        recordIdList: number[]
    ) {
        // 포트폴리오 ID로 마스터 포트폴리오를 찾습니다.
        const masterPortfolio = await qr.manager.findOne(MasterPortfolio, {
            where: { id: portfolioId, user: { id: userId } },
            relations: ['project'],
        });
        if (!masterPortfolio) {
            throw new MasterPortfolioNotFoundException();
        }
        const masterPortfolioId = masterPortfolio.id;
        const projectId = masterPortfolio.project.id;

        // 이미 생성된 질문이 있는지 확인합니다.
        const existingQuestions = await qr.manager.findOne(Questions, {
            where: { masterPortfolio: { id: masterPortfolioId } },
        });
        if (existingQuestions) {
            throw new AIGenerationAlreadyExists();
        }

        // recordId 정보 저장하기 (선택된 회의록)
        for (const recordId of recordIdList) {
            await qr.manager.update(Plan, { id: recordId }, { masterPortfolioId });
        }

        // TODO: 가져오는 데이터가 많음, 정리할 것
        // 가져올 데이터
        const projectData = await getProjectData(qr, userId, masterPortfolioId, projectId);

        // TODO: inputData 형태 정리
        const inputData: string = JSON.stringify({
            userName: projectData.userName,
            role: projectData.role,
            projectName: projectData.projectName,
            projectPeriod: projectData.projectPeriod,
            category: projectData.category,
            contributionRate: projectData.contributionRate,
            records: projectData.records,
            tasks: projectData.tasks,
            personalRecall: projectData.personalRecall,
        });

        // LLM을 호출하여 질문을 생성합니다.
        const questions: Array<Question> = await this.llmService.generateQuestions(inputData);

        // 생성된 질문들을 데이터베이스에 저장합니다.
        const questionEntities: QuestionResponseDto[] = [];
        for (const q of questions) {
            try {
                // questionType 유효성 검증
                if (!Object.values(QuestionType).includes(q.questionType)) {
                    // 추후 추가적인 처리 필요
                    throw new InvalidQuestionTypeException(q.questionType);
                }

                const questionEntity = qr.manager.create(Questions, {
                    questionId: q.id,
                    questionType: q.questionType as QuestionType,
                    question: q.question,
                    masterPortfolio: { id: masterPortfolioId },
                });
                const savedQuestion = await qr.manager.save(Questions, questionEntity);
                questionEntities.push(QuestionResponseDto.from(savedQuestion));
            } catch (e) {
                throw new QuestionGenerationException(e.message);
            }
        }

        // 마스터 포트폴리오 상태 업데이트
        await qr.manager.update(
            MasterPortfolio,
            { id: masterPortfolioId },
            { status: MasterPortfolioStatus.NEED_ANSWERS }
        );

        return questionEntities;
    }

    // 마스터 포트폴리오 질문 조회
    async getQuestions(portfolioId: number) {
        const questions = await this.questionsRepository.find({
            where: { masterPortfolio: { id: portfolioId } },
            order: { questionId: 'ASC' },
        });
        if (questions.length === 0) {
            throw new QuestionNotFoundException(
                '생성된 질문이 없습니다. 먼저 질문을 생성해주세요.'
            );
        }

        return questions;
    }

    // TODO: 커스텀 에러 추가
    // 마스터 포트폴리오 질문(답변) 업데이트
    async updateQuestions(qr: QueryRunner, portfolioId: number, questions: UpdateQuestionDto[]) {
        for (const q of questions) {
            const questionId = q.questionId;
            const questionExists = await qr.manager.findOne(Questions, {
                where: { questionId, masterPortfolio: { id: portfolioId } },
            });
            if (!questionExists) {
                // questionId+portfolioId가 존재하지 않을 때
                throw new QuestionNotFoundException(
                    `질문 ID ${questionId}는 포트폴리오 ${portfolioId}에 존재하지 않습니다.`
                );
            }

            const questionType = questionExists.questionType;
            if (questionType === QuestionType.YES_NO) {
                if (q.answer) {
                    await qr.manager.update(
                        Questions,
                        { questionId, masterPortfolio: { id: portfolioId } },
                        {
                            answer: q.answer,
                            reason: q.reason,
                        }
                    );
                } else {
                    throw new QuestionUpdateException(
                        `질문 타입이 ${QuestionType.YES_NO}인 질문 ID ${questionId}는 answer 값이 필요합니다.`
                    );
                }
            } else if (questionType === QuestionType.TEXT) {
                // answer가 있으면 안됨
                if (q.answer) {
                    throw new QuestionUpdateException(
                        `질문 타입이 ${QuestionType.TEXT}인 질문 ID ${questionId}는 answer 값이 존재할 수 없습니다.`
                    );
                }
                await qr.manager.update(
                    Questions,
                    { questionId, masterPortfolio: { id: portfolioId } },
                    {
                        reason: q.reason,
                    }
                );
            }
        }
        return await qr.manager.find(Questions, {
            where: { masterPortfolio: { id: portfolioId } },
            order: { questionId: 'ASC' },
        });
    }

    // 마스터 포트폴리오 AI 생성
    async generateMasterPortfolio(qr: QueryRunner, userId: number, portfolioId: number) {
        // 포트폴리오 ID로 마스터 포트폴리오를 찾습니다.
        const masterPortfolio = await qr.manager.findOne(MasterPortfolio, {
            where: { id: portfolioId, user: { id: userId } },
            relations: ['project'],
        });
        if (!masterPortfolio) {
            throw new MasterPortfolioNotFoundException();
        }

        // 질문이 생성된 상태인지 확인합니다.
        const checkQuestions = await qr.manager.findOne(Questions, {
            where: { masterPortfolio: { id: portfolioId } },
        });
        if (!checkQuestions) {
            throw new QuestionNotFoundException(
                '마스터 포트폴리오 AI 생성을 하기 위해서는 질문이 먼저 생성되어야 합니다.'
            );
        }

        // 프로젝트 ID를 가져옵니다.
        const projectId = masterPortfolio.project.id;
        const masterPortfolioId = masterPortfolio.id;

        // 이미 생성된 마스터 포트폴리오 AI가 있는지 확인합니다.
        const existingPortfolioAI = await this.masterPortfolioAIRepository.findOne({
            where: { user: { id: userId }, project: { id: projectId } },
        });
        if (existingPortfolioAI) {
            throw new AIGenerationAlreadyExists();
        }

        // 입력할 데이터 가져오기
        const questionData = await this.getQuestions(portfolioId);
        const projectData: ProjectData = await getProjectData(
            qr,
            userId,
            masterPortfolioId,
            projectId
        );

        // 진행 상태를 `GENERATING`으로 업데이트합니다.
        await this.masterPortfolioRepository.update(
            { id: portfolioId },
            { status: MasterPortfolioStatus.GENERATING }
        );

        try {
            const generatedPortfolio: MasterPortfolioOutput =
                await this.llmService.generateMasterPortfolio(questionData, projectData);
            if (!generatedPortfolio) {
                // 실패 시, 상태를 이전으로 돌립니다.
                await this.masterPortfolioRepository.update(
                    { id: portfolioId },
                    { status: MasterPortfolioStatus.NEED_ANSWERS }
                );

                throw new MasterPortfolioAIGenerateFailException(
                    '생성 결과가 없습니다. 다시 시도해주세요.'
                );
            }

            // 생성된 마스터 포트폴리오를 데이터베이스에 저장합니다.
            const createdPortfolio = qr.manager.create(MasterPortfolioAI, {
                user: { id: userId },
                project: { id: projectId },
                detailInfo: generatedPortfolio.detailInfo,
                assignedTask: generatedPortfolio.assignedTask,
                keyAchievement: generatedPortfolio.keyAchievement,
                insight: generatedPortfolio.insight,
            });

            // TODO: 직접작성 기능을 도입하는 시점에는 해당 코드 삭제
            // 생성된 결과를 마스터 포트폴리오 엔티티에도 저장합니다.
            await qr.manager.update(
                MasterPortfolio,
                { id: portfolioId },
                {
                    detailInfo: generatedPortfolio.detailInfo,
                    assignedTask: generatedPortfolio.assignedTask,
                    keyAchievement: generatedPortfolio.keyAchievement,
                    insight: generatedPortfolio.insight,
                }
            );

            try {
                await qr.manager.save(MasterPortfolioAI, createdPortfolio);
            } catch (e) {
                throw new MasterPortfolioSaveFailException(e.message);
            }
        } catch (error) {
            // 실패 시, 상태를 이전으로 돌립니다.
            await this.masterPortfolioRepository.update(
                { id: portfolioId },
                { status: MasterPortfolioStatus.NEED_ANSWERS }
            );

            throw error;
        }

        // 생성된 마스터 포트폴리오 AI 결과를 반환합니다.
        const generatedPortfolioResponse = await qr.manager.findOne(MasterPortfolioAI, {
            where: { user: { id: userId }, project: { id: projectId } },
        });
        if (!generatedPortfolioResponse) {
            throw new MasterPortfolioAINotFoundException();
        }

        // 마스터 포트폴리오 상태 업데이트
        await qr.manager.update(
            MasterPortfolio,
            { id: portfolioId },
            { status: MasterPortfolioStatus.DONE }
        );

        return MasterPortfolioAIResponseDto.from(generatedPortfolioResponse);
    }

    // 마스터 포트폴리오 AI 생성 결과 조회
    async getMasterPortfolioGenerationResult(userId: number, portfolioId: number) {
        // 포트폴리오 ID로 project ID를 찾습니다.
        const masterPortfolio = await this.masterPortfolioRepository.findOne({
            where: { id: portfolioId, user: { id: userId } },
            relations: ['project'],
        });
        if (!masterPortfolio) {
            throw new MasterPortfolioNotFoundException();
        }

        const masterPortfolioAI = await this.masterPortfolioAIRepository.findOne({
            where: { user: { id: userId }, project: { id: masterPortfolio.project.id } },
        });
        if (!masterPortfolioAI) {
            throw new MasterPortfolioAINotFoundException();
        }
        return MasterPortfolioAIResponseDto.from(masterPortfolioAI);
    }

    // 마스터 포트폴리오 생성 (project 종료할 때 사용)
    async createMasterPortfolio(manager: EntityManager, userId: number, projectId: number) {
        const existingPortfolio = await this.masterPortfolioRepository.findOne({
            where: { user: { id: userId }, project: { id: projectId } },
        });
        if (existingPortfolio) {
            throw new MasterPortfolioDuplicateException(userId, projectId);
        }

        const masterPortfolio = this.masterPortfolioRepository.create({
            user: { id: userId },
            project: { id: projectId },
            category: portfolioType.COURSE, // 기본 카테고리 설정 (수업)
            contributionRate: 0, // 초기 기여도 설정 (0%)
        });
        await manager.save(MasterPortfolio, masterPortfolio);
        return MasterPortfolioResponseDto.from(masterPortfolio);
    }

    // 마스터 포트폴리오 조회
    async getMasterPortfolio(userId: number, portfolioId: number) {
        const masterPortfolio = await this.masterPortfolioRepository.findOne({
            where: { user: { id: userId }, id: portfolioId },
            relations: ['project'],
        });
        if (!masterPortfolio) {
            throw new MasterPortfolioNotFoundException();
        }
        return MasterPortfolioDetailResponseDto.from(masterPortfolio);
    }

    // 마스터 포트폴리오 업데이트
    async updateMasterPortfolio(
        qr: QueryRunner,
        userId: number,
        portfolioId: number,
        updateDataDto: MasterPortfolioRequestDto
    ) {
        await qr.manager.update(
            MasterPortfolio,
            {
                user: { id: userId },
                id: portfolioId,
            },
            updateDataDto
        );

        const masterPortfolio = await qr.manager.findOne(MasterPortfolio, {
            where: { user: { id: userId }, id: portfolioId },
            relations: ['project'],
        });
        if (!masterPortfolio) {
            throw new MasterPortfolioNotFoundException();
        }
        return MasterPortfolioResponseDto.from(masterPortfolio);
    }

    // 사용자 별 마스터 포트폴리오 조회
    async getMasterPortfoliosByUser(userId: number, cursorDate: Date, pageSize: number) {
        const portfolios = await this.masterPortfolioRepository
            .createQueryBuilder('mp')
            .leftJoin('mp.project', 'project')
            .addSelect(['mp.id', 'mp.category', 'mp.contributionRate', 'mp.mainTask'])
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
                ? portfolios[portfolios.length - 2].createdAt.toISOString()
                : null;
        const result = portfolios
            .slice(0, pageSize)
            .map((entity) => UserMasterPortfoliosResponseDto.fromEntity(entity));
        return PaginatedResponseDto.of(result, nextCursor, hasNextPage);
    }

    // 마스터포트폴리오 소유자 체크
    async checkMasterPortfolioOwner(userId: number, portfolioId: number): Promise<Boolean> {
        const masterPortfolio = await this.masterPortfolioRepository.findOne({
            where: { id: portfolioId },
            relations: ['user'],
        });
        if (!masterPortfolio) {
            throw new MasterPortfolioNotFoundException();
        }
        if (masterPortfolio.user.id !== userId) return false;
        return true;
    }

    // 선택 가능한 회의록 조회
    async getProjectRecords(userId: number, portfolioId: number) {
        const masterPortfolio = await this.masterPortfolioRepository.findOne({
            where: { id: portfolioId, user: { id: userId } },
            relations: ['project'],
        });
        if (!masterPortfolio) {
            throw new MasterPortfolioNotFoundException();
        }
        const projectId = masterPortfolio.project?.id;

        // projectId에 해당하는 프로젝트에서 해당 user가 참여한 일정만 가져오기 (참석자 기준)
        const plans = await this.planRepository.find({
            where: { project: { id: projectId }, attendees: { user: { id: userId } } },
            select: ['id', 'name', 'date', 'meetingRecords'],
            order: { date: 'ASC' }, // 날짜 빠른 순으로 정렬
        });

        // TODO: 글자 수 바탕으로 토큰 수 계산 -> 토큰 수 바탕으로 크레딧 계산 (BM 확정 필요)

        return plans.map((plan) => SelectablePlanResponseDto.fromEntity(plan));
    }

    // 진행 상태 조회
    async getStatus(portfolioId: number) {
        const status = await this.masterPortfolioRepository.findOne({
            where: { id: portfolioId },
            select: ['status'],
        });
        if (!status) {
            throw new MasterPortfolioNotFoundException();
        }

        return {
            id: portfolioId,
            status: status.status,
        };
    }
}
