import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
    namespace: '/plans',
    cors: {origin: '*'},
    transports: ['websocket'],
})
export class PlansGateway{
    @WebSocketServer()
    server: Server;

    //수정사항 브로드캐스트
    broadCastUpdate(
        planId: number,
        msg: any
    ){
        this.server.to(`plan-${planId}`).emit('receive-update', msg);
        console.log('broadcast');
    }

    //일정 상세페이지 접속
    @SubscribeMessage('join')
    handleJoin(
        @MessageBody() payload: { planId: number},
        @ConnectedSocket() client: Socket,
    ){
        const planId = payload.planId;
        client.join(`plan-${planId}`);
        console.log(`join to plan-${planId}`);
    }

    //일정 상세페이지 disconnect
    @SubscribeMessage('leave')
    handleLeave(
        @MessageBody() payload: { planId: number},
        @ConnectedSocket() client: Socket,
    ){
        const planId = payload.planId;
        client.leave(`plan-${planId}`);
        console.log(`leave from plan-${planId}`);
    }
}