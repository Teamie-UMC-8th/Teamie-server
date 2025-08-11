import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventPayloadDto } from 'src/common/dtos/event-payload.dto';
import { RealTimeEntity, RealTimeMessage } from 'src/common/response/real-time-response.dto';

@Injectable()
export class PlansListener {
    @OnEvent('plan.*', { async: true })
    async handlePlan(payload: EventPayloadDto) {
        const msg = RealTimeMessage.of(payload.type, RealTimeEntity.PLAN, payload.data);
        console.log('Plan event:', msg);
        //TODO: gateway broadcast 추가
    }
}
