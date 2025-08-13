import { Test, TestingModule } from '@nestjs/testing';
import { AppGateway } from './app.gateway';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { Server, Socket } from 'socket.io';
import { SubscribePayloadDto } from './dtos/subscribe-payload.dto';
import {
    RealTimeEntity,
    RealTimeMessage,
    RealTimeType,
} from 'src/common/response/real-time-response.dto';
import { SubEventType } from 'src/common/enums/sub-event-type.enum';

describe('AppGateway', () => {
    let gateway: AppGateway;
    let authService: AuthService;
    let consoleLogSpy: jest.SpyInstance;
    let moduleRef: TestingModule;

    const mockServer = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
    };

    // 소켓 모킹용 유틸
    const createMockSocket = (id: string, cookies = 'accessToken=validtoken') =>
        ({
            id,
            handshake: { headers: { cookie: cookies } },
            disconnect: jest.fn(),
            join: jest.fn(),
            leave: jest.fn(),
            emit: jest.fn(),
            data: {},
        }) as unknown as Socket;

    beforeEach(async () => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        consoleLogSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        moduleRef = await Test.createTestingModule({
            providers: [
                AppGateway,
                {
                    provide: AuthService,
                    useValue: {
                        verifyWsToken: jest.fn(),
                    },
                },
            ],
        }).compile();

        gateway = moduleRef.get<AppGateway>(AppGateway);
        authService = moduleRef.get<AuthService>(AuthService);
        gateway.server = mockServer as unknown as Server;

        jest.clearAllMocks();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    afterAll(async () => {
        await moduleRef.close();
    });

    it('handleConnection: handshake 시 액세스토큰이 없거나 유효하지 않을 경우 연결을 해제', async () => {
        const socket = createMockSocket('socket1', '');
        await gateway.handleConnection(socket);
        expect(socket.disconnect).toHaveBeenCalled();
        expect(gateway['subscriptions'].has(socket.id)).toBe(false);
        expect(gateway['userSockets'].has(1)).toBe(false);
        expect(gateway['socketsMap'].has(socket.id)).toBe(false);
    });

    it('handleConnection: 유효한 토큰에 대해 소켓 클라이언트에 사용자 데이터 저장 및 구독 정보 생성', async () => {
        const socket = createMockSocket('socket2', 'accessToken=validtoken');
        (authService.verifyWsToken as jest.Mock).mockResolvedValue(1);
        await gateway.handleConnection(socket);
        expect(authService.verifyWsToken).toHaveBeenCalledWith('validtoken');
        expect(socket.data.user).toEqual(1);
        expect(gateway['subscriptions'].has(socket.id)).toBe(true);
        expect(gateway['userSockets'].has(1)).toBe(true);
        expect(gateway['userSockets'].get(1)).toContain(socket.id);
        expect(gateway['socketsMap'].has(socket.id)).toBe(true);
        expect(gateway['socketsMap'].get(socket.id)).toBe(socket);
    });

    it('handleDisconnect: 소켓 연결 해제 시 구독 정보를 메모리에서 해제', async () => {
        const socket = createMockSocket('socket3');
        socket.data.user = 1;
        gateway['subscriptions'].set(socket.id, new Set());
        gateway['userSockets'].set(1, new Set([socket.id]));
        gateway['socketsMap'].set(socket.id, socket);
        await gateway.handleDisconnect(socket);
        expect(gateway['subscriptions'].has(socket.id)).toBe(false);
        expect(gateway['userSockets'].has(1)).toBe(false);
        expect(gateway['socketsMap'].has(socket.id)).toBe(false);
    });

    it('subscribe: sub 이벤트에 대해 room join 및 구독 정보 업데이트', async () => {
        const socket = createMockSocket('socket4');
        gateway['subscriptions'].set(socket.id, new Set());

        const payload: SubscribePayloadDto = { eventType: SubEventType.PLAN_DETAIL, id: 123 };
        await gateway.handleSubscribe(payload, socket);

        const expectedRoom = `${payload.eventType}:${payload.id}`;
        expect(socket.join).toHaveBeenCalledWith(expectedRoom);
        expect(gateway['subscriptions'].get(socket.id)?.has(expectedRoom)).toBe(true);
    });

    it('unsubscribe: unsub 이벤트에 대해 room leave 및 구독 정보 메모리에서 해제', async () => {
        const socket = createMockSocket('socket5');
        const roomKey = `${SubEventType.PLAN_DETAIL}:123`;
        gateway['subscriptions'].set(socket.id, new Set([roomKey]));

        const payload: SubscribePayloadDto = { eventType: SubEventType.PLAN_DETAIL, id: 123 };
        await gateway.handleUnsubscribe(payload, socket);

        expect(socket.leave).toHaveBeenCalledWith(roomKey);
        expect(gateway['subscriptions'].get(socket.id)?.has(roomKey)).toBe(false);
    });

    it('handlePublish: 이벤트에 대해 room에 브로드캐스트', () => {
        const roomKey = 'event:123';
        const payload = RealTimeMessage.of(RealTimeType.DELETED, RealTimeEntity.PLAN, {
            foo: 'bar',
        });
        gateway.handlePublish(roomKey, payload);
        expect(mockServer.to).toHaveBeenCalledWith(roomKey);
        expect(mockServer.emit).toHaveBeenCalledWith('publish', payload);
    });

    it('handleBanUser: 강제 구독 해제 이벤트', async () => {
        const socket = createMockSocket('socket6');
        gateway['subscriptions'].set(socket.id, new Set('event:123'));
        gateway['userSockets'].set(123, new Set([socket.id]));
        gateway['socketsMap'].set(socket.id, socket);
        const roomKey = 'event:123';
        const userId = 123;

        await gateway.handleBanUser(userId, roomKey);
        expect(socket.emit).toHaveBeenCalledWith('unsubscribe-forced', {
            roomKey,
            reason: '관리자에 의해 접근이 차단되었습니다.',
        });
        expect(socket.leave).toHaveBeenCalledWith(roomKey);
        expect(gateway['subscriptions'].get(socket.id)?.has(roomKey)).toBe(false);
    });
});
