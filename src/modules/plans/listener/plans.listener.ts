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

@Injectable()
export class PlansListener {
    constructor(private readonly gateway: AppGateway) {}

    // planId, projectId 정보 필요
    @OnEvent(`${RealTimeEntity.PLAN}.${RealTimeType.DELETED}`, { async: true })
    async handlePlan(payload: EventPayloadDto) {
        console.log('일정 삭제 동기화 이벤트');
        const msg = RealTimeMessage.of(payload.type, RealTimeEntity.PLAN, '삭제됨');
        // 일정 상세 페이지
        const planKey = `${SubEventType.PLAN_DETAIL}:${payload.data.planId}`;
        this.gateway.handlePublish(planKey, msg);
        // 팀 캘린더
        const projectKey = `${SubEventType.PROJECT_CALENDER}:${payload.data.projectId}`;
        this.gateway.handlePublish(projectKey, msg);
    }
}
