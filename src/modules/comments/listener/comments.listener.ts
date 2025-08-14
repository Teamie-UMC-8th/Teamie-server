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
export class CommentsListener {
    constructor(private readonly gateway: AppGateway) {}

    /** 댓글 생성 → 업무 상세에 반영 */
    @OnEvent(`${RealTimeEntity.COMMENT}.${RealTimeType.CREATED}`, { async: true })
    async onTaskCreated(payload: EventPayloadDto) {
        const detailRoom = `${SubEventType.TASK_DETAIL}:${payload.data.taskId}`;
        const msg = RealTimeMessage.of(
            RealTimeType.CREATED,
            RealTimeEntity.COMMENT,
            payload.data.comment
        );
        this.gateway.handlePublish(detailRoom, msg);
    }

    /** 댓글 수정 → 업무 상세에 반영 */
    @OnEvent(`${RealTimeEntity.COMMENT}.${RealTimeType.UPDATED}`, { async: true })
    async onTaskUpdated(payload: EventPayloadDto) {
        const detailRoom = `${SubEventType.TASK_DETAIL}:${payload.data.taskId}`;
        const msg = RealTimeMessage.of(
            RealTimeType.UPDATED,
            RealTimeEntity.COMMENT,
            payload.data.comment
        );

        this.gateway.handlePublish(detailRoom, msg);
    }

    /** 댓글 삭제 → 업무 상세에 반영 */
    @OnEvent(`${RealTimeEntity.COMMENT}.${RealTimeType.DELETED}`, { async: true })
    async onTaskDeleted(payload: EventPayloadDto) {
        const detailRoom = `${SubEventType.TASK_DETAIL}:${payload.data.taskId}`;
        const msg = RealTimeMessage.of(RealTimeType.DELETED, RealTimeEntity.COMMENT, {
            id: payload.data.commentId,
        });

        this.gateway.handlePublish(detailRoom, msg);
    }
}
