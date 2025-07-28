import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Plan } from './plans.entity';
import { QueryRunner, Repository } from 'typeorm';
import { PlanDetails } from './dtos/plan-details.dto';
import {
    PlanNotFoundException,
    PlanTransactionException,
    ProjectForbiddenException,
} from 'src/common/exceptions/custom.errors';
import { ProjectsService } from '../projects/projects.service';
import { CreatePlanReq, CreatePlanResponse } from './dtos/create-plan.dto';

@Injectable()
export class PlansService {
    constructor(
        @InjectRepository(Plan)
        private readonly plansRepository: Repository<Plan>,
        private readonly projectsService: ProjectsService
    ) {}

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
        req: CreatePlanReq
    ): Promise<CreatePlanResponse> {
        const projectId: number = Number(req.projectId);
        const date: Date = new Date(req.date);
        // 유효한 식별자인지 & 사용자 권한 check
        const project = await this.projectsService.assertProjectExists(projectId);
        const checkUserIsMember = await this.projectsService.checkProjectMember(userId, projectId);
        if (!checkUserIsMember) {
            throw new ProjectForbiddenException();
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
