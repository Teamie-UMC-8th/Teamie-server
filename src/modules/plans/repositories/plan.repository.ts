import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Plan } from '../entities/plan.entity';
import { QueryRunner, Repository } from 'typeorm';
import { PlanNotFoundException } from 'src/common/exceptions/custom.errors';
import { BasicUpdatePlanReqDTO } from '../dtos/update-plan.dto';

@Injectable()
export class PlanRepository {
    constructor(
        @InjectRepository(Plan)
        private readonly planRepository: Repository<Plan>
    ) {}

    async savePlan(qr: QueryRunner, plan: Partial<Plan>): Promise<Plan> {
        return await qr.manager.save(Plan, plan);
    }

    async deletePlan(qr: QueryRunner, planId: number): Promise<void> {
        await qr.manager.delete(Plan, planId);
    }

    // 조회
    async findByIdWithProjectId(planId: number): Promise<Plan> {
        const plan = await this.planRepository.findOne({
            where: { id: planId },
            relations: { project: true },
            select: { id: true, project: { id: true } },
        });
        if (!plan) throw new PlanNotFoundException({ planId: Number(planId) });
        return plan;
    }

    async findByIdWithDetail(planId: number): Promise<Plan> {
        const plan = await this.planRepository
            .createQueryBuilder('plan')
            .leftJoinAndSelect('plan.attendees', 'attendee')
            .leftJoinAndSelect('plan.writers', 'writer')
            .leftJoinAndSelect('attendee.user', 'attendeeUser')
            .leftJoinAndSelect('writer.user', 'writerUser')
            //TODO: @Column({ select: false }) 옵션 활용하여 쿼리 최적화
            .where('plan.id = :planId', { planId })
            .getOne();
        if (!plan) throw new PlanNotFoundException({ planId: Number(planId) });
        return plan;
    }

    async findAllByDate(projectId: number, startDate: Date, endDate: Date): Promise<any> {
        return await this.planRepository
            .createQueryBuilder('plan')
            .select(['plan.date AS date', 'plan.id AS id', 'plan.name AS name'])
            .where('plan.projectId = :projectId', { projectId })
            .andWhere('plan.date BETWEEN :startDate AND :endDate', { startDate, endDate })
            .orderBy('plan.date', 'ASC')
            .getRawMany();
    }

    // 수정
    async updateWithBasicDTO(
        qr: QueryRunner,
        planId: number,
        body: BasicUpdatePlanReqDTO
    ): Promise<void> {
        await qr.manager.update(Plan, { id: planId }, body);
    }

    // 조회 with QueryRunner
    async findByIdUsingQR(qr: QueryRunner, planId: number): Promise<Plan> {
        const plan = await qr.manager.findOne(Plan, {
            where: { id: planId },
            relations: ['project'],
        });
        if (!plan) throw new PlanNotFoundException({ planId: Number(planId) });
        return plan;
    }

    async findByIdWithDetailUsingQR(qr: QueryRunner, planId: number): Promise<Plan> {
        const plan = await qr.manager
            .createQueryBuilder(Plan, 'plan')
            .leftJoinAndSelect('plan.attendees', 'attendee')
            .leftJoinAndSelect('plan.writers', 'writer')
            .leftJoinAndSelect('attendee.user', 'attendeeUser')
            .leftJoinAndSelect('writer.user', 'writerUser')
            .where('plan.id = :planId', { planId })
            .getOne();
        if (!plan) throw new PlanNotFoundException({ planId: Number(planId) });
        return plan;
    }
}
