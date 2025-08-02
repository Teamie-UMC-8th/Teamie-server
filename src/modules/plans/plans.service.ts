import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Plan } from './plans.entity';
import { Between, QueryRunner, Repository } from 'typeorm';
import { PlanDetails } from './dtos/plan-details.dto';
import {
    PlanDateConflictException,
    PlanNotFoundException,
    PlanTransactionException,
    ProjectForbiddenException,
} from 'src/common/exceptions/custom.errors';
import { ProjectsService } from '../projects/projects.service';
import { CreatePlanResponse } from './dtos/create-plan.dto';
import { CalenderCardResponseDto } from '../projects/dtos/team-calender-response.dto';

@Injectable()
export class PlansService {
    constructor(
        @InjectRepository(Plan)
        private readonly plansRepository: Repository<Plan>,
        @Inject(forwardRef(() => ProjectsService))
        private readonly projectsService: ProjectsService
    ) {}

    // 날짜 별 일정 조회
    async getPlansByDate(
        projectId: number,
        startDate: Date,
        endDate: Date
    ): Promise<Record<string, CalenderCardResponseDto[]>> {
        const plans = await this.plansRepository
            .createQueryBuilder('plan')
            .select(['plan.date AS date', 'plan.id AS id', 'plan.name AS name'])
            .where('plan.projectId = :projectId', { projectId })
            .andWhere('plan.date BETWEEN :startDate AND :endDate', { startDate, endDate })
            .orderBy('plan.date', 'ASC')
            .getRawMany();

        //날짜 별 그룹핑
        const grouped = plans.reduce(
            (acc, curr) => {
                const date = curr.date.toISOString().split('T')[0];
                if (!acc[date]) acc[date] = [];
                acc[date].push(CalenderCardResponseDto.fromPlan(curr));
                return acc;
            },
            {} as Record<string, CalenderCardResponseDto[]>
        );
        return grouped;
    }

    // 일정 상세 페이지 조회
    async getDetails(planId: number): Promise<PlanDetails> {
        const plan = await this.plansRepository
            .createQueryBuilder('plan')
            .leftJoinAndSelect('plan.attendees', 'attendee')
            .leftJoinAndSelect('plan.writers', 'writer')
            .leftJoinAndSelect('attendee.user', 'attendeeUser')
            .leftJoinAndSelect('writer.user', 'writerUser')
            //TODO: @Column({ select: false }) 옵션 활용하여 쿼리 최적화
            .where('plan.id = :planId', { planId })
            .getOne();
        if (!plan) throw new PlanNotFoundException(planId);
        return PlanDetails.from(plan);
    }

    // NOTE: 사용자의 권한 체크, Custom Guard로 추후 리팩토링 예정
    async checkPermission(userId: number, planId: number): Promise<Boolean> {
        const plan = await this.plansRepository.findOne({
            where: { id: planId },
            relations: { project: true },
            select: { id: true },
        });
        if (!plan) throw new PlanNotFoundException({ planId: Number(planId) });
        const projectId = plan?.project.id;
        return await this.projectsService.checkProjectMember(userId, projectId);
    }

    // 일정 생성
    async createPlan(
        qr: QueryRunner,
        userId: number,
        projectId: number,
        date: Date
    ): Promise<CreatePlanResponse> {
        // 유효한 식별자인지 & 사용자 권한 check
        const project = await this.projectsService.assertProjectExists(projectId);
        const checkUserIsMember = await this.projectsService.checkProjectMember(userId, projectId);
        if (!checkUserIsMember) {
            throw new ProjectForbiddenException();
        }

        // 프로젝트 생성일자와 일정 생성일자 비교
        if (project.createdAt > date) {
            throw new PlanDateConflictException({
                createdAt: project.createdAt.toISOString(),
                date: date.toISOString(),
            });
        }

        try {
            const newPlan = qr.manager.create(Plan, {
                project: project,
                date: date,
            });
            const savedPlan = await qr.manager.save(Plan, newPlan);
            return CreatePlanResponse.fromEntity(savedPlan);
        } catch (err) {
            throw new PlanTransactionException();
        }
    }
}
