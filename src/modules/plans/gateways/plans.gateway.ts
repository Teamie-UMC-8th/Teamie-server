import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
    RealTimeEntity,
    RealTimeMessage,
    RealTimeType,
} from 'src/common/response/real-time-response.dto';
import { PlanDetails } from '../dtos/plan-details.dto';
import { PlansService } from '../plans.service';
import { PlanNotFoundException } from 'src/common/exceptions/custom.errors';
import { UseFilters, UseGuards } from '@nestjs/common';
import { WsAuthGuard } from 'src/modules/auth/guards/ws-auth.guard';
import { WebSocketExceptionFilter } from 'src/common/exceptions/ws-exception.filter';

@UseFilters(new WebSocketExceptionFilter())
@UseGuards(WsAuthGuard)
@WebSocketGateway({
    namespace: '/plans',
    cors: { origin: '*' },
    transports: ['websocket'],
})
export class PlansGateway {
    constructor(private readonly plansService: PlansService) {}

    @WebSocketServer()
    server: Server;

    //수정사항 브로드캐스트
    broadCastUpdate(planId: number, msg: any) {
        this.server.to(`plan-${planId}`).emit('receive-update', msg);
        console.log('broadcast');
    }

    //일정 상세페이지 접속
    @SubscribeMessage('join')
    handleJoin(@MessageBody() payload: { planId: number }, @ConnectedSocket() client: Socket) {
        console.log(client.data.userId);
        const planId = payload.planId;
        client.join(`plan-${planId}`);
        console.log(`join to plan-${planId}`);
    }

    //최신 동기화 요청(일정 상세페이지 조회)
    @SubscribeMessage('sync-update')
    async handleSyncMessage(
        @MessageBody() payload: { planId: number },
        @ConnectedSocket() client: Socket
    ): Promise<RealTimeMessage<PlanDetails>> {
        try {
            const detail = await this.plansService.getDetails(payload.planId);
            return RealTimeMessage.of(RealTimeType.SYNCED, RealTimeEntity.PLAN, detail);
        } catch (error) {
            if (error instanceof PlanNotFoundException) {
                throw new WsException(error.message);
            }
            throw error;
        }
    }

    //일정 상세페이지 disconnect
    @SubscribeMessage('leave')
    handleLeave(@MessageBody() payload: { planId: number }, @ConnectedSocket() client: Socket) {
        const planId = payload.planId;
        client.leave(`plan-${planId}`);
        console.log(`leave from plan-${planId}`);
    }
}
