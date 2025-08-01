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
    ForbiddenUserForMasterPortfolioException,
    MasterPortfolioAINotFoundException,
    MasterPortfolioDuplicateException,
    MasterPortfolioNotFoundException,
} from 'src/common/exceptions/custom.errors';
import { QuestionResponseDto } from './dtos/question-response.dto';
import { QuestionType } from 'src/common/enums/question-type.enum';
import { MasterPortfolioRequestDto } from './dtos/master-portfolio-request.dto';
import { UserMasterPortfoliosResponseDto } from './dtos/user-master-portfolios-response.dto';
import { PaginatedResponseDto } from 'src/common/response/paginated-response.dto';
import { MasterPortfolioAI } from './entities/master-portfolio-ai.entity';
import { MasterPortfolioAIResponseDto } from './dtos/master-portfolio-ai-response.dto';
import { Task } from '../tasks/entities/tasks.entity';
import { Plan } from '../plans/entities/plans.entity';
import { PersonalRecall } from '../personal-recalls/entities/personal-recalls.entity';
import { portfolioType } from 'src/common/enums/portfolio-type.enum';
import { Project } from '../projects/entities/projects.entity';
import { EntityManager } from 'typeorm';

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
        private readonly llmService: LLMService
    ) {}

    // 마스터 포트폴리오 질문 생성
    async createQuestions(qr: QueryRunner, userId: number, projectId: number, recordIdList: number[]) {
        // 프로젝트 ID로 마스터 포트폴리오를 찾습니다.
        const masterPortfolio = await qr.manager.findOne(MasterPortfolio, {
            where: { project: { id: projectId }, user: { id: userId } },
        });
        if (!masterPortfolio) {
            throw new MasterPortfolioNotFoundException();
        }
        const masterPortfolioId = masterPortfolio.id;

        // recordId 정보 저장하기 (선택된 회의록)
        for (const recordId of recordIdList) {
            await qr.manager.update(
                Plan,
                { id: recordId },
                { masterPortfolioId }
            )
        }

        let inputData;
        // 가져올 데이터
        // 1. 선택된 회의록 내용
        const records = await qr.manager.find(Plan, {
            where: { id: In(recordIdList) },
            select: ['meetingRecords'],
        });
        // 2. 담당자로 지정된 모든 업무명
        const tasks = await qr.manager.find(Task, {
            where: { managers: { user: { id: userId } }, step: { project: { id: projectId } } },
            select: ['name'], // 업무명만 필요한 경우
        })
        // 3. 개인회고 내용
        const personalRecalls = await qr.manager.find(PersonalRecall, {
            where: { user: { id: userId }, project: { id: projectId } },
            select: ['collaborationProfile', 'memorableExperience', 'strengthsAndGrowth']
        })
        // 4. 프로젝트 명 / 분류 태그 / 기여도
        const projectDate = await this.projectRepository.findOne({
            where: { id: projectId },
            select: ['createdAt', 'completedAt'],
        })
        if (!projectDate) {
            console.log('Project date not found');
            throw new InternalServerErrorException('프로젝트 정보를 찾을 수 없습니다.');
        }
        console.log('projectDate', projectDate.completedAt);
        const completedAt = projectDate.completedAt;
        // const createdAt = projectDate.createdAt ? projectDate.createdAt.getTime() : 0;
        // const projectPeriod = Math.ceil((completedAt - createdAt) / (1000 * 60 * 60 * 24));
        // 이름과 역할(role)
        // 프로젝트명, 진행기간
        // const projectInfo = await qr.manager.findOne(Project, {
        //     where: { id: projectId },
        //     select: ['name', ''],
        // })

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

        return questionEntities;
    }

    // 마스터 포트폴리오 AI 생성
    async generateMasterPortfolio(qr: QueryRunner, userId: number, projectId: number) {
        // 프로젝트 ID로 마스터 포트폴리오를 찾습니다.
        const masterPortfolio = await qr.manager.findOne(MasterPortfolio, {
            where: { project: { id: projectId }, user: { id: userId } },
        });
        if (!masterPortfolio) {
            throw new MasterPortfolioNotFoundException();
        }

        // 임시로 더미 데이터 사용
        let projectData: any;
        const generatedPortfolio: MasterPortfolioOutput =
            await this.llmService.generateMasterPortfolio(projectData);
        if (!generatedPortfolio) {
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
        return MasterPortfolioAIResponseDto.from(generatedPortfolioResponse);
    }

    // 마스터 포트폴리오 AI 생성 결과 조회
    async getMasterPortfolioGenerationResult(userId: number, projectId: number) {
        const masterPortfolioAI = await this.masterPortfolioAIRepository.findOne({
            where: { user: { id: userId }, project: { id: projectId } },
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
    async getMasterPortfolio(userId: number, projectId: number) {
        const masterPortfolio = await this.masterPortfolioRepository.findOne({
            where: { user: { id: userId }, project: { id: projectId } },
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
        projectId: number,
        updateDataDto: MasterPortfolioRequestDto
    ) {
        await qr.manager.update(
            MasterPortfolio,
            {
                user: { id: userId },
                project: { id: projectId },
            },
            updateDataDto
        );

        const masterPortfolio = await qr.manager.findOne(MasterPortfolio, {
            where: { user: { id: userId }, project: { id: projectId } },
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
}
