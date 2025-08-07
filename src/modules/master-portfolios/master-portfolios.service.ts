import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Questions } from './entities/questions.entity';
import { In, QueryRunner, Repository } from 'typeorm';
import { MasterPortfolio } from './entities/master-portfolios.entity';
import { LLMService } from 'src/infra/llm/llm.service';
import { Question } from 'src/common/types/question.type';
import { MasterPortfolioOutput } from 'src/common/types/master-portfolio.type';
import { MasterPortfolioResponseDto } from './dtos/master-portfolio-response.dto';
import {
    AIGenerationAlreadyExists,
    ForbiddenUserForMasterPortfolioException,
    MasterPortfolioAINotFoundException,
    MasterPortfolioDuplicateException,
    MasterPortfolioNotFoundException,
    ProjectNotFoundException,
} from 'src/common/exceptions/custom.errors';
import { QuestionResponseDto } from './dtos/question-response.dto';
import { QuestionType } from 'src/common/enums/question-type.enum';
import { MasterPortfolioRequestDto } from './dtos/master-portfolio-request.dto';
import { UserMasterPortfoliosResponseDto } from './dtos/user-master-portfolios-response.dto';
import { PaginatedResponseDto } from 'src/common/response/paginated-response.dto';
import { MasterPortfolioAI } from './entities/master-portfolio-ai.entity';
import { MasterPortfolioAIResponseDto } from './dtos/master-portfolio-ai-response.dto';
import { Task } from '../tasks/entities/tasks.entity';
import { Plan } from '../plans/entities/plan.entity';
import { PersonalRecall } from '../personal-recalls/entities/personal-recalls.entity';
import { portfolioType } from 'src/common/enums/portfolio-type.enum';
import { Project } from '../projects/entities/projects.entity';
import { EntityManager } from 'typeorm';
import { User } from '../users/entities/users.entity';
import { UserProject } from '../mappings/user-projects/userProjects.entity';
import { SelectablePlanResponseDto } from './dtos/selectable-plan.dto';
import { MasterPortfolioStatus } from 'src/common/enums/master-portfolio-status.enum';

function getPeriod(createdAt: Date, completedAt: Date): string {
    let years = completedAt.getFullYear() - createdAt.getFullYear();
    let months = completedAt.getMonth() - createdAt.getMonth();
    let days = completedAt.getDate() - createdAt.getDate();

    // 월 차이가 음수인 경우 보정
    if (days < 0) {
        months -= 1;
        const prevMonth = new Date(completedAt.getFullYear(), completedAt.getMonth(), 0);
        days += prevMonth.getDate();
    }
    // 연 차이가 음수인 경우 보정
    if (months < 0) {
        years -= 1;
        months += 12;
    }

    // 0인 단위는 표시하지 않음
    const period: string[] = [];
    if (years > 0) period.push(`${years}년`);
    if (months > 0) period.push(`${months}개월`);
    if (days > 0) period.push(`${days}일`);
    return period.join(' ');
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
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
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
        const detailInfo = masterPortfolio.detailInfo;
        const assignedTask = masterPortfolio.assignedTask;
        const keyAchievement = masterPortfolio.keyAchievement;
        const insight = masterPortfolio.insight;

        // recordId 정보 저장하기 (선택된 회의록)
        for (const recordId of recordIdList) {
            await qr.manager.update(Plan, { id: recordId }, { masterPortfolioId });
        }

        // TODO: 가져오는 데이터가 많음, 정리할 것
        // 가져올 데이터
        // 1. 선택된 회의록 내용
        const records = await qr.manager.find(Plan, {
            where: { id: In(recordIdList) },
            select: ['meetingRecords'],
        });
        // 2. 담당자로 지정된 모든 업무명
        const tasks = await qr.manager.find(Task, {
            where: { managers: { user: { id: userId } }, step: { project: { id: projectId } } },
            select: ['name'],
        });
        // 3. 개인회고 내용
        const personalRecalls = await qr.manager.findOne(PersonalRecall, {
            where: { user: { id: userId }, project: { id: projectId } },
            select: ['id', 'collaborationProfile', 'memorableExperience', 'strengthsAndGrowth'],
        });
        // 4. 프로젝트명, 진행기간
        const projectInfo = await qr.manager.findOne(Project, {
            where: { id: projectId },
            select: ['createdAt', 'completedAt', 'name'],
        });
        if (!projectInfo) {
            throw new ProjectNotFoundException(`Project with ID ${projectId} not found`);
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
                `Master portfolio with ID ${masterPortfolioId} not found`
            );
        }
        const category: string = masterPortfolioData.category;
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

        // TODO: inputData 형태 정리
        const inputData: string = JSON.stringify({
            userName: userName?.name,
            role: role?.role,
            projectName,
            projectPeriod,
            createdAt,
            completedAt,
            category,
            contributionRate,
            records,
            tasks,
            personalRecalls,
            masterPortfolio: {
                detailInfo,
                assignedTask,
                keyAchievement,
                insight,
            },
        });

        // 이미 생성된 질문이 있는지 확인합니다.
        const existingQuestions = await qr.manager.findOne(Questions, {
            where: { masterPortfolio: { id: masterPortfolioId } },
        });
        if (existingQuestions) {
            throw new AIGenerationAlreadyExists();
        }

        // LLM을 호출하여 질문을 생성합니다.
        const questions: Array<Question> = await this.llmService.generateQuestions(inputData);

        // 생성된 질문들을 데이터베이스에 저장합니다.
        const questionEntities: QuestionResponseDto[] = [];
        for (const q of questions) {
            try {
                // questionType 유효성 검증
                if (!Object.values(QuestionType).includes(q.questionType)) {
                    // 추후 추가적인 처리 필요
                    throw new Error(`Invalid question type: ${q.questionType}`);
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
                console.error(`질문 생성 중 오류 발생: ${e.message}`);
                throw new InternalServerErrorException(`Failed to create question: ${e.message}`);
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

        // 프로젝트 ID를 가져옵니다.
        const projectId = masterPortfolio.project.id;

        // 이미 생성된 마스터 포트폴리오 AI가 있는지 확인합니다.
        const existingPortfolioAI = await this.masterPortfolioAIRepository.findOne({
            where: { user: { id: userId }, project: { id: projectId } },
        });
        if (existingPortfolioAI) {
            throw new AIGenerationAlreadyExists();
        }

        // 임시로 더미 데이터 사용
        let projectData: any;

        // 진행 상태를 `GENERATING`으로 업데이트합니다.
        await this.masterPortfolioRepository.update(
            { id: portfolioId },
            { status: MasterPortfolioStatus.GENERATING }
        );

        const generatedPortfolio: MasterPortfolioOutput =
            await this.llmService.generateMasterPortfolio(projectData);
        if (!generatedPortfolio) {
            // 실패 시, 상태를 이전으로 돌립니다.
            await this.masterPortfolioRepository.update(
                { id: portfolioId },
                { status: MasterPortfolioStatus.NEED_ANSWERS }
            );

            throw new InternalServerErrorException('Failed to generate master portfolio');
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

        try {
            await qr.manager.save(MasterPortfolioAI, createdPortfolio);
        } catch (e) {
            console.error(`마스터 포트폴리오 AI 생성 중 오류 발생: ${e.message}`);
            throw new InternalServerErrorException(
                `Failed to save master portfolio AI: ${e.message}`
            );
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
        return MasterPortfolioResponseDto.from(masterPortfolio);
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

    //사용자 별 마스터 포트폴리오 조회
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

    //마스터포트폴리오 소유자 체크
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

    async getStatus(userId: number, portfolioId: number) {
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
