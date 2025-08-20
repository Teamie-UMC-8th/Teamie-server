import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventPayloadDto } from 'src/common/dtos/event-payload.dto';
import { SubEventType } from 'src/common/enums/sub-event-type.enum';
import {
    RealTimeEntity,
    RealTimeMessage,
    RealTimeType,
} from 'src/common/response/real-time-response.dto';
import { AppGateway } from 'src/infra/gateway/app.gateway';
import { UpdatedPlanDTO } from '../dtos/plan-payload.dto';
import { ValidatePayloadDto } from 'src/infra/gateway/dtos/subscribe-payload.dto';
import { PlanRepository } from '../repositories/plan.repository';
import { UserProjectRepository } from 'src/modules/projects/user-projects/repositories/user-project.repository';

@Injectable()
export class PlansListener {
    constructor(
        private readonly gateway: AppGateway,
        private readonly planRepository: PlanRepository,
        private readonly userProjectRepository: UserProjectRepository
    ) {}

    /* planId validation */
    @OnEvent(`${SubEventType.PLAN_DETAIL}.validate`, { async: true })
    async validateTaskId(dto: ValidatePayloadDto) {
        const { payload, client } = dto;
        const id = payload.id;
        const userId = client.data.user;
        try {
            const plan = await this.planRepository.findByIdWithProjectId(id);
            const projectId = plan.project.id;
            const isProjectMember = await this.userProjectRepository.findUserProject(
                userId,
                projectId
            );
            if (!isProjectMember) {
                client.emit('exception', {
                    message: `NOT_PROJECT_MEMBER(${id})`,
                });
            }
        } catch (err) {
            client.emit('exception', {
                message: `PLAN_NOT_FOUND(${id})`,
            });
            await this.gateway.handleUnsubscribe(payload, client);
        }
    }

    @OnEvent(`${RealTimeEntity.PLAN}.${RealTimeType.DELETED}`, { async: true })
    async handlePlanDeleted(payload: EventPayloadDto) {
        const msg = RealTimeMessage.of(payload.type, RealTimeEntity.PLAN, payload.data.plan);
        // 일정 상세 페이지
        const planKey = `${SubEventType.PLAN_DETAIL}:${payload.data.plan.id}`;
        this.gateway.handlePublish(planKey, msg);
        await this.gateway.handleBanUser(payload.data.userId, planKey);
        // 팀 캘린더
        const projectKey = `${SubEventType.PROJECT_CALENDER}:${payload.data.projectId}`;
        this.gateway.handlePublish(projectKey, msg);
    }

    @OnEvent(`${RealTimeEntity.PLAN}.${RealTimeType.CREATED}`, { async: true })
    async handlePlanCreated(payload: EventPayloadDto) {
        const msg = RealTimeMessage.of(payload.type, RealTimeEntity.PLAN, payload.data.plan);
        // 팀 캘린더
        const projectKey = `${SubEventType.PROJECT_CALENDER}:${payload.data.projectId}`;
        this.gateway.handlePublish(projectKey, msg);
    }

    @OnEvent(`${RealTimeEntity.PLAN}.${RealTimeType.UPDATED}`, { async: true })
    async handlePlanUpdated(payload: EventPayloadDto) {
        const msg = RealTimeMessage.of(payload.type, RealTimeEntity.PLAN, payload.data.plan);
        // 일정 상세 페이지
        const planKey = `${SubEventType.PLAN_DETAIL}:${payload.data.plan.id}`;
        this.gateway.handlePublish(planKey, msg);

        const result: UpdatedPlanDTO = payload.data.plan;
        //결과가 일정의 이름 또는 날짜를 포함하는 경우
        if (result.name !== undefined || result.date !== undefined) {
            // 팀 캘린더
            const projectKey = `${SubEventType.PROJECT_CALENDER}:${payload.data.projectId}`;
            this.gateway.handlePublish(projectKey, msg);
        }
    }
}
