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
export class TaskFilesListener {
    constructor(private readonly gateway: AppGateway) {}

    @OnEvent(`${RealTimeEntity.TASK_FILE}.${RealTimeType.CREATED}`, { async: true })
    async onTaskFileCreated(payload: EventPayloadDto) {
        // payload.data: { projectId, taskId, file: { id, fileUrl } }
        const detailRoom = `${SubEventType.TASK_DETAIL}:${payload.data.taskId}`;
        const msg = RealTimeMessage.of(
            RealTimeType.CREATED,
            RealTimeEntity.TASK_FILE,
            payload.data.file // { id, fileUrl }
        );
        this.gateway.handlePublish(detailRoom, msg);
    }

    @OnEvent(`${RealTimeEntity.TASK_FILE}.${RealTimeType.DELETED}`, { async: true })
    async onTaskFileDeleted(payload: EventPayloadDto) {
        // payload.data: { projectId, taskId, fileId }
        const detailRoom = `${SubEventType.TASK_DETAIL}:${payload.data.taskId}`;
        const msg = RealTimeMessage.of(
            RealTimeType.DELETED,
            RealTimeEntity.TASK_FILE,
            { id: payload.data.fileId } // 삭제는 id만 내려도 UI에서 제거 가능
        );
        this.gateway.handlePublish(detailRoom, msg);
    }
}
