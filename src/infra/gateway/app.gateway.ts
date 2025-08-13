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

    // 소켓 관리
    private socketsMap = new Map<string, Socket>();
    // 클라이언트 별 구독 관리: socket.id -> 구독하는 room 이름
    // NOTE: 단일 구독 방식으로 수정 필요
    private subscriptions: Map<string, Set<string>> = new Map();
    // ban을 위한 userId -> socket.id 매핑
    private userSockets: Map<number, Set<string>> = new Map();
    constructor(private readonly authService: AuthService) {}

    async handleConnection(client: Socket) {
        //사용자 인증/인가
        const cookies = client.handshake.headers.cookie || '';
        const token = getAccessTokenFromCookie(cookies);
        if (!token) {
            console.warn(`Socket ${client.id} 연결 거부: 토큰 없음`);
            client.disconnect();
            return;
        }
        try {
            client.data.user = await this.authService.verifyWsToken(token);
            //NOTE: 추후 중간에 토큰의 인증이 만료되는 경우도 고려해야함.
            this.socketsMap.set(client.id, client);
            const userId = client.data.user;
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId)?.add(client.id);
            this.subscriptions.set(client.id, new Set());
        } catch (err) {
            console.error(`Socket ${client.id} 인증 실패:`, err);
            client.disconnect(true);
        }
    }

    async handleDisconnect(client: Socket) {
        const userId = client.data?.user;
        this.subscriptions.delete(client.id);
        if(userId !== undefined) {
            this.userSockets.get(userId)?.delete(client.id);
            if (this.userSockets.get(userId)?.size === 0) {
                this.userSockets.delete(userId);
            }
        }
        this.socketsMap.delete(client.id);
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

    // 사용자 ban
    async handleBanUser(userId: number, roomKey: string) {
        const socketIds = this.userSockets.get(userId) ?? new Set();

        for (const id of socketIds) {
            const socket = this.socketsMap.get(id);
            if (!socket) continue;

            socket.emit('unsubscribe-forced', {
                roomKey,
                reason: '관리자에 의해 접근이 차단되었습니다.',
            });
            socket.leave(roomKey);

            const subs = this.subscriptions.get(id);
            subs?.delete(roomKey);
            if (subs?.size === 0) {
                this.subscriptions.delete(id);
            }
        }
    }
}
