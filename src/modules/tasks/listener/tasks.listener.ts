import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventPayloadDto } from 'src/common/dtos/event-payload.dto';
import { AppGateway } from 'src/infra/gateway/app.gateway';
import { SubEventType } from 'src/common/enums/sub-event-type.enum';
import {
    RealTimeEntity,
    RealTimeMessage,
    RealTimeType,
} from 'src/common/response/real-time-response.dto';

@Injectable()
export class TasksListener {
    constructor(private readonly gateway: AppGateway) {}

    /** 업무 생성 → 프로젝트 대시보드에만 반영 */
    @OnEvent(`${RealTimeEntity.TASK}.${RealTimeType.CREATED}`, { async: true })
    async onTaskCreated(payload: EventPayloadDto) {
        // payload.data: { projectId, task: { id, name, status, deadline, stepId, managers[] } }
        const dashboardRoom = `${SubEventType.PROJECT_DASHBOARD}:${payload.data.projectId}`;
        const msg = RealTimeMessage.of(
            RealTimeType.CREATED,
            RealTimeEntity.TASK,
            payload.data.task
        );
        this.gateway.handlePublish(dashboardRoom, msg);
    }

    /** 업무 수정 → 대시보드 + 업무 상세에 모두 반영 */
    @OnEvent(`${RealTimeEntity.TASK}.${RealTimeType.UPDATED}`, { async: true })
    async onTaskUpdated(payload: EventPayloadDto) {
        // payload.data: { projectId, taskId, diff: { name?, status?, deadline?, managers?, stepId? } }
        const dashboardRoom = `${SubEventType.PROJECT_DASHBOARD}:${payload.data.projectId}`;
        const detailRoom = `${SubEventType.TASK_DETAIL}:${payload.data.taskId}`;
        const msg = RealTimeMessage.of(
            RealTimeType.UPDATED,
            RealTimeEntity.TASK,
            { id: payload.data.taskId, ...payload.data.diff } // 변경 필드만
        );

        this.gateway.handlePublish(dashboardRoom, msg);
        this.gateway.handlePublish(detailRoom, msg);
    }

    /** 업무 삭제 → 대시보드 + 업무 상세 반영 + 상세 페이지 접속자 튕김 */
    @OnEvent(`${RealTimeEntity.TASK}.${RealTimeType.DELETED}`, { async: true })
    async onTaskDeleted(payload: EventPayloadDto) {
        // payload.data: { projectId, taskId }
        const dashboardRoom = `${SubEventType.PROJECT_DASHBOARD}:${payload.data.projectId}`;
        const detailRoom = `${SubEventType.TASK_DETAIL}:${payload.data.taskId}`;
        const msg = RealTimeMessage.of(RealTimeType.DELETED, RealTimeEntity.TASK, {
            id: payload.data.taskId,
        });

        this.gateway.handlePublish(dashboardRoom, msg);
        this.gateway.handlePublish(detailRoom, msg);
        // 상세 페이지 사용자 강제 이탈
        this.gateway.server.to(detailRoom).emit('forceLeave', { room: detailRoom });
    }
}
