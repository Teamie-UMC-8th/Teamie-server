import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { PlanDetails } from '../dtos/plan-details.dto';
import {
    PlanDateConflictException,
    PlanTransactionException,
    ProjectForbiddenException,
    TransactionException,
} from 'src/common/exceptions/custom.errors';
import { ProjectsService } from '../../projects/services/projects.service';
import { CreatePlanResponse } from '../dtos/create-plan.dto';
import { DeletePlanResponseDto } from '../dtos/delete-plan.dto';
import { CalenderCardResponseDto } from '../../projects/dtos/team-calender-response.dto';
import { BasicUpdatePlanReqDTO, UpdatePlanUserReqDTO } from '../dtos/update-plan.dto';
import { Writer } from '../entities/writers.entity';
import { Attendee } from '../entities/attendees.entity';
import { UsersService } from '../../users/services/users.service';
import { PlanRepository } from '../repositories/plan.repository';
import { WriterRepository } from '../repositories/writers.repository';
import { AttendeeRepository } from '../repositories/attendees.repository';

import { EventBusService } from 'src/infra/event-bus/event-bus.service';
import { RealTimeEntity, RealTimeType } from 'src/common/response/real-time-response.dto';
import { EventPayloadDto } from 'src/common/dtos/event-payload.dto';
import { CreatedPlanDTO, DeletedPlanDTO, UpdatedPlanDTO } from '../dtos/plan-payload.dto';

@Injectable()
export class PlansService {
    constructor(
        private readonly planRepository: PlanRepository,
        private readonly writerRepository: WriterRepository,
        private readonly attendeeRepository: AttendeeRepository,
        @Inject(forwardRef(() => ProjectsService))
        private readonly projectsService: ProjectsService,
        private readonly usersService: UsersService,
        private readonly eventBus: EventBusService
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
                deleteWriters.map(
                    async (id) => await this.writerRepository.deleteWriter(qr, planId, id)
                )
            );
            // 기존 배열에 없었으나 body에 있으면 => 추가
            await Promise.all(
                addWriters.map(async (id) => {
                    const writer = qr.manager.create(Writer, {
                        plan: { id: planId },
                        user: { id },
                    });
                    return await this.writerRepository.saveWriter(qr, writer);
                })
            );
            // 최신 사항 조회
            const plan = await this.planRepository.findByIdUsingQR(qr, planId);
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
                deleteAttendees.map(
                    async (id) => await this.attendeeRepository.deleteAttendee(qr, planId, id)
                )
            );
            // 기존 배열에 없었으나 body에 있으면 => 추가
            await Promise.all(
                addAttendees.map((id) => {
                    const attendee = qr.manager.create(Attendee, {
                        plan: { id: planId },
                        user: { id },
                    });
                    return this.attendeeRepository.saveAttendee(qr, attendee);
                })
            );
            // 최신 사항 조회
            const plan = await this.planRepository.findByIdUsingQR(qr, planId);
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
        const plans = await this.planRepository.findAllByDate(projectId, startDate, endDate);
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
        return PlanDetails.from(await this.planRepository.findByIdWithDetail(planId));
    }

    // NOTE: 사용자의 권한 체크, Custom Guard로 추후 리팩토링 예정
    async checkPermission(userId: number, planId: number): Promise<Boolean> {
        const plan = await this.planRepository.findByIdWithProjectId(planId);
        const projectId = plan.project.id;
        return await this.projectsService.assertProjectMember(userId, projectId);
    }

    // 일정 생성
    async createPlan(qr: QueryRunner, projectId: number, date: Date): Promise<CreatePlanResponse> {
        // 유효한 식별자인지 & 사용자 권한 check
        const project = await this.projectsService.isProjectExists(projectId, qr.manager);

        // 프로젝트 생성일자와 일정 생성일자 비교
        if (project.createdAt > date) {
            throw new PlanDateConflictException({
                createdAt: project.createdAt.toISOString(),
                date: date.toISOString(),
            });
        }

        try {
            const newPlan = await this.planRepository.savePlan(qr, {
                project: project,
                date: date,
            });
            await this.eventBus.publishAsync(
                `${RealTimeEntity.PLAN}.${RealTimeType.CREATED}`,
                EventPayloadDto.from(RealTimeType.CREATED, {
                    projectId: projectId,
                    plan: CreatedPlanDTO.from(newPlan),
                })
            );
            return CreatePlanResponse.fromEntity(newPlan);
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
        const plan = await this.planRepository.findByIdUsingQR(qr, planId);

        // 2. 수정 권한 체크
        await this.projectsService.isProjectMember(userId, plan.project.id, qr.manager);
        // 3. 일정 수정
        try {
            await this.planRepository.updateWithBasicDTO(qr, planId, body);
            const updatedPlan = PlanDetails.from(
                await this.planRepository.findByIdWithDetailUsingQR(qr, planId)
            );
            await this.eventBus.publishAsync(
                `${RealTimeEntity.PLAN}.${RealTimeType.UPDATED}`,
                EventPayloadDto.from(RealTimeType.CREATED, {
                    projectId: plan.project.id,
                    plan: UpdatedPlanDTO.from(body, updatedPlan),
                })
            );
            return updatedPlan;
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
        const plan = await this.planRepository.findByIdUsingQR(qr, planId);

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
            const planDetail = await this.planRepository.findByIdWithDetailUsingQR(qr, planId);
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
            await this.planRepository.savePlan(qr, planDetail);
            const updatedPlan = PlanDetails.from(
                await this.planRepository.findByIdWithDetailUsingQR(qr, planId)
            );
            await this.eventBus.publishAsync(
                `${RealTimeEntity.PLAN}.${RealTimeType.UPDATED}`,
                EventPayloadDto.from(RealTimeType.CREATED, {
                    projectId: plan.project.id,
                    plan: UpdatedPlanDTO.from(body, updatedPlan),
                })
            );
            return updatedPlan;
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
        const plan = await this.planRepository.findByIdUsingQR(qr, planId);

        // 2. 사용자의 삭제 권한 검사
        const projectId = plan.project.id;
        const checkUserIsMember = await this.projectsService.isProjectMember(
            userId,
            projectId,
            qr.manager
        );
        if (!checkUserIsMember) {
            throw new ProjectForbiddenException();
        }

        // 3. 일정 삭제
        await this.planRepository.deletePlan(qr, planId);
        await this.eventBus.publishAsync(
            `${RealTimeEntity.PLAN}.${RealTimeType.DELETED}`,
            EventPayloadDto.from(RealTimeType.DELETED, {
                projectId: projectId,
                plan: DeletedPlanDTO.from(planId),
            })
        );
        return DeletePlanResponseDto.from(planId);
    }
}
