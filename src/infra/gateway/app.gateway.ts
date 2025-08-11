import { UseFilters, ValidationPipe } from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebSocketExceptionFilter } from 'src/common/exceptions/ws-exception.filter';
import { SubscribePayloadDto } from './dtos/subscribe-payload.dto';
import { allowedOrigins } from 'src/config/app.config';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { RealTimeMessage } from 'src/common/response/real-time-response.dto';
import { getAccessTokenFromCookie } from 'src/common/utils/cookie.parse';

@UseFilters(new WebSocketExceptionFilter())
@WebSocketGateway({
    cors: {
        origin: [allowedOrigins],
        credentials: true,
    },
    namespace: '/ws',
    transports: ['websocket'],
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // 클라이언트 별 구독 관리: socket.id -> 구독하는 room 이름
    private subscriptions: Map<string, Set<string>> = new Map();
    constructor(private readonly authService: AuthService) {}

    async handleConnection(client: Socket) {
        //사용자 인증/인가
        const cookies = client.handshake.headers.cookie || '';
        const token = getAccessTokenFromCookie(cookies);
        if (!token) {
            client.disconnect();
            return;
        }
        try {
            client.data.user = await this.authService.verifyWsToken(token);
            //NOTE: 추후 중간에 토큰의 인증이 만료되는 경우도 고려해야함.
            this.subscriptions.set(client.id, new Set());
        } catch (err) {
            console.log(err);
            client.disconnect(true);
        }
    }

    async handleDisconnect(client: Socket) {
        this.subscriptions.delete(client.id);
    }

    @SubscribeMessage('subscribe')
    async handleSubscribe(
        @MessageBody(new ValidationPipe()) payload: SubscribePayloadDto,
        @ConnectedSocket() client: Socket
    ) {
        const roomKey: string = `${payload.eventType}:${payload.id}`;
        const clientSubs = this.subscriptions.get(client.id);
        if (clientSubs && !clientSubs.has(roomKey)) {
            client.join(roomKey);
            clientSubs.add(roomKey);
            console.log(`join to ${roomKey}`);
        }
    }

    @SubscribeMessage('unsubscribe')
    async handleUnsubscribe(
        @MessageBody(new ValidationPipe()) payload: SubscribePayloadDto,
        @ConnectedSocket() client: Socket
    ) {
        const roomKey: string = `${payload.eventType}:${payload.id}`;
        client.leave(roomKey);
        console.log(`leave from ${roomKey}`);
        this.subscriptions.get(client.id)?.delete(roomKey);
    }

    // 브로드캐스트
    handlePublish(roomKey: string, payload: RealTimeMessage) {
        this.server.to(`${roomKey}`).emit('publish', payload);
        console.log('broadcast');
    }
}
