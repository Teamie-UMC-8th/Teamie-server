import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Plan } from '../entities/plan.entity';
import { EntityManager, QueryRunner, Repository } from 'typeorm';
import { PlanDetails } from '../dtos/plan-details.dto';
import {
    PlanDateConflictException,
    PlanNotFoundException,
    PlanTransactionException,
    ProjectForbiddenException,
    TransactionException,
} from 'src/common/exceptions/custom.errors';
import { ProjectsService } from '../../projects/services/projects.service';
import { CreatePlanResponse } from '../dtos/create-plan.dto';
import { DeletePlanResponseDto } from '../dtos/delete-plan.dto';
import { CalenderCardResponseDto } from '../../projects/dtos/team-calender-response.dto';
import { BasicUpdatePlanReqDTO, UpdatePlanUserReqDTO } from '../dtos/update-plan.dto';
import { Writer } from '../../mappings/writers/writers.entity';
import { Attendee } from '../../mappings/attendees/attendees.entity';
import { UsersService } from '../../users/services/users.service';

@Injectable()
export class PlansService {
    constructor(
        @InjectRepository(Plan)
        private readonly plansRepository: Repository<Plan>,
        @InjectRepository(Writer)
        private readonly writersRepository: Repository<Writer>,
        @Inject(forwardRef(() => ProjectsService))
        private readonly projectsService: ProjectsService,
        private readonly usersService: UsersService
    ) {}

    // 기록자 수정 유틸 함수
    private async updateWriters(
        qr: QueryRunner,
        planId: number,
        oldSet: Set<number>,
        newSet: Set<number>
    ): Promise<Writer[]> {
        const deleteWriters = [...oldSet].filter((id) => !newSet.has(id));
        const addWriters = [...newSet].filter((id) => !oldSet.has(id));

        try {
            // 기존 배열에 있었으나 body에 없으면 => 삭제
            await Promise.all(
                deleteWriters.map((id) =>
                    qr.manager.delete(Writer, {
                        plan: { id: planId },
                        user: { id },
                    })
                )
            );
            // 기존 배열에 없었으나 body에 있으면 => 추가
            await Promise.all(
                addWriters.map((id) => {
                    const newWriter = qr.manager.create(Writer, {
                        plan: { id: planId },
                        user: { id },
                    });
                    return qr.manager.save(newWriter);
                })
            );
            // 최신 사항 조회
            const plan = await qr.manager.findOne(Plan, {
                where: { id: planId },
            });
            if (!plan) throw new PlanNotFoundException();
            return plan.writers;
        } catch (e) {
            console.log(e);
            throw new TransactionException('WRITER');
        }
    }

    // 참여자 수정 유틸 함수
    private async updateAttendees(
        qr: QueryRunner,
        planId: number,
        oldSet: Set<number>,
        newSet: Set<number>
    ): Promise<Attendee[]> {
        const deleteAttendees = [...oldSet].filter((id) => !newSet.has(id));
        const addAttendees = [...newSet].filter((id) => !oldSet.has(id));

        try {
            // 기존 배열에 있었으나 body에 없으면 => 삭제
            await Promise.all(
                deleteAttendees.map((id) =>
                    qr.manager.delete(Attendee, {
                        plan: { id: planId },
                        user: { id },
                    })
                )
            );
            // 기존 배열에 없었으나 body에 있으면 => 추가
            await Promise.all(
                addAttendees.map((id) => {
                    const newAttendee = qr.manager.create(Attendee, {
                        plan: { id: planId },
                        user: { id },
                    });
                    return qr.manager.save(newAttendee);
                })
            );
            // 최신 사항 조회
            const plan = await qr.manager.findOne(Plan, {
                where: { id: planId },
            });
            if (!plan) throw new PlanNotFoundException();
            return plan.attendees;
        } catch (e) {
            console.log(e);
            throw new TransactionException('Attendee');
        }
    }

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
    private async getDetailsWithQueryRunner(qr: QueryRunner, planId: number): Promise<Plan | null> {
        return await qr.manager
            .createQueryBuilder(Plan, 'plan')
            .leftJoinAndSelect('plan.attendees', 'attendee')
            .leftJoinAndSelect('plan.writers', 'writer')
            .leftJoinAndSelect('attendee.user', 'attendeeUser')
            .leftJoinAndSelect('writer.user', 'writerUser')
            .where('plan.id = :planId', { planId })
            .getOne();
    }

    // NOTE: 사용자의 권한 체크, Custom Guard로 추후 리팩토링 예정
    async checkPermission(
        manager: EntityManager,
        userId: number,
        planId: number
    ): Promise<Boolean> {
        const plan = await this.plansRepository.findOne({
            where: { id: planId },
            relations: { project: true },
            select: { id: true },
        });
        if (!plan) throw new PlanNotFoundException({ planId: Number(planId) });
        const projectId = plan?.project.id;
        return await this.projectsService.assertProjectMember(userId, projectId);
    }

    // 일정 생성
    async createPlan(
        qr: QueryRunner,
        userId: number,
        projectId: number,
        date: Date
    ): Promise<CreatePlanResponse> {
        // 유효한 식별자인지 & 사용자 권한 check
        const project = await this.projectsService.isProjectExists(projectId, qr.manager);
        const checkUserIsMember = await this.projectsService.isProjectMember(
            userId,
            projectId,
            qr.manager
        );
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

    // 일정 수정
    async updatePlan(
        qr: QueryRunner,
        userId: number,
        planId: number,
        body: BasicUpdatePlanReqDTO
    ): Promise<PlanDetails> {
        // 1. planId에 해당하는 plan의 존재 여부 확인
        const plan = await qr.manager.findOne(Plan, {
            where: { id: planId },
            relations: ['project'],
        });
        if (!plan)
            throw new PlanNotFoundException({
                planId: planId,
            });

        // 2. 수정 권한 체크
        await this.projectsService.isProjectMember(userId, plan.project.id, qr.manager);
        // 3. 일정 수정
        try {
            await qr.manager.update(Plan, { id: planId }, body);
            const planDetail = await this.getDetailsWithQueryRunner(qr, planId);
            if (!planDetail) throw new PlanNotFoundException();
            return PlanDetails.from(planDetail);
        } catch (e) {
            console.log(e);
            throw new PlanTransactionException();
        }
    }

    // 일정의 참여자/기록자 수정
    async updatePlanMembers(
        qr: QueryRunner,
        userId: number,
        planId: number,
        body: UpdatePlanUserReqDTO
    ) {
        // 1. planId에 해당하는 plan의 존재 여부 확인
        const plan = await qr.manager.findOne(Plan, {
            where: { id: planId },
            relations: ['project'],
        });
        if (!plan)
            throw new PlanNotFoundException({
                planId: planId,
            });

        // 2. 프로젝트 권한 체크: 기본 수정 권한
        const checkUserIsMember = await this.projectsService.isProjectMember(
            userId,
            plan.project.id,
            qr.manager
        );
        if (!checkUserIsMember) {
            throw new ProjectForbiddenException();
        }

        // 3. req의 유효성 체크
        if (Array.isArray(body.writers))
            await this.usersService.checkIsUserExistByArray(body.writers, plan.project.id);
        if (Array.isArray(body.attendees))
            await this.usersService.checkIsUserExistByArray(body.attendees, plan.project.id);

        try {
            const planDetail = await this.getDetailsWithQueryRunner(qr, planId);
            if (!planDetail) throw new PlanNotFoundException();
            // 4. 참여자 수정
            if (Array.isArray(body.writers)) {
                const oldSet = new Set(planDetail.writers.map((w) => w.user.id));
                const newSet = new Set(body.writers || []);
                const writers = await this.updateWriters(qr, planId, oldSet, newSet);
                planDetail.writers = writers;
            }
            // 5. 기록자 수정
            if (Array.isArray(body.attendees)) {
                const oldSet = new Set(planDetail.attendees.map((a) => a.user.id));
                const newSet = new Set(body.attendees || []);
                const attendees = await this.updateAttendees(qr, planId, oldSet, newSet);
                planDetail.attendees = attendees;
            }
            // 6. 일정 수정
            await qr.manager.save(Plan, planDetail);
            const updatedPlan = await this.getDetailsWithQueryRunner(qr, planId);
            if (!updatedPlan) throw new PlanNotFoundException();
            return PlanDetails.from(updatedPlan);
        } catch (e) {
            console.log(e);
            throw new PlanTransactionException();
        }
    }

    // 일정 삭제
    async deletePlan(
        qr: QueryRunner,
        userId: number,
        planId: number
    ): Promise<DeletePlanResponseDto> {
        // 1. planId에 해당하는 plan 조회
        const plan = await qr.manager.findOne(Plan, {
            where: { id: planId },
            relations: ['project'],
        });
        if (!plan)
            throw new PlanNotFoundException({
                planId: planId,
            });

        // 2. 사용자의 삭제 권한 검사
        const checkUserIsMember = await this.projectsService.isProjectMember(
            userId,
            plan.project.id,
            qr.manager
        );
        if (!checkUserIsMember) {
            throw new ProjectForbiddenException();
        }

        // 3. 일정 삭제
        await qr.manager.delete(Plan, planId);
        return DeletePlanResponseDto.from(planId);
    }
}
