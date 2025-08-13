import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { plainToClass } from 'class-transformer';
import { EventPayloadDto } from 'src/common/dtos/event-payload.dto';
import { SubEventType } from 'src/common/enums/sub-event-type.enum';
import {
    RealTimeEntity,
    RealTimeMessage,
    RealTimeType,
} from 'src/common/response/real-time-response.dto';
import { AppGateway } from 'src/infra/gateway/app.gateway';
@Injectable()
export class StepsListener {
    constructor(private readonly gateway: AppGateway) {}

    /** 스텝 생성 -> 업무 대시보드에 반영 */
    @OnEvent(`${RealTimeEntity.STEP}.${RealTimeType.CREATED}`, { async: true })
    async handleStepCreated(payload: EventPayloadDto) {
        console.log('스텝 생성 동기화 이벤트');
        const msg = RealTimeMessage.of(
            RealTimeType.CREATED,
            RealTimeEntity.STEP,
            payload.data.step
        );
        const dashboardRoom = `${SubEventType.PROJECT_DASHBOARD}:${payload.data.projectId}`;
        this.gateway.handlePublish(dashboardRoom, msg);
    }

    /** 스텝 이름 수정 -> 업무 대시보드에 반영 */
    @OnEvent(`${RealTimeEntity.STEP}.${RealTimeType.UPDATED}`, { async: true })
    async handleStepUpdated(payload: EventPayloadDto) {
        console.log('스텝 이름 수정 동기화 이벤트');
        const msg = RealTimeMessage.of(RealTimeType.UPDATED, RealTimeEntity.STEP, {
            id: payload.data.stepId,
            name: payload.data.name,
        });
        const dashboardRoom = `${SubEventType.PROJECT_DASHBOARD}:${payload.data.projectId}`;
        this.gateway.handlePublish(dashboardRoom, msg);
    }

    /** 스텝 삭제 -> 업무 대시보드에 반영 */
    @OnEvent(`${RealTimeEntity.STEP}.${RealTimeType.DELETED}`, { async: true })
    async handleStepDeleted(payload: EventPayloadDto) {
        console.log('스텝 삭제 동기화 이벤트');
        const msg = RealTimeMessage.of(RealTimeType.DELETED, RealTimeEntity.STEP, {
            id: payload.data.stepId,
        });
        const dashboardRoom = `${SubEventType.PROJECT_DASHBOARD}:${payload.data.projectId}`;
        this.gateway.handlePublish(dashboardRoom, msg);
    }
}
