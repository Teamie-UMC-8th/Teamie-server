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

    describe('Connection Management', () => {
        it('handleConnection: handshake 시 액세스토큰이 없거나 유효하지 않을 경우 연결을 해제', async () => {
            const socket = createMockSocket('socket1', '');
            await gateway.handleConnection(socket);
            expect(socket.disconnect).toHaveBeenCalled();
            expect(gateway['userSockets'].has(1)).toBe(false);
            expect(gateway['socketsMap'].has(socket.id)).toBe(false);
        });

        it('handleConnection: 유효한 토큰에 대해 소켓 클라이언트에 사용자 데이터 저장 및 구독 정보 생성', async () => {
            const socket = createMockSocket('socket2', 'accessToken=validtoken');
            (authService.verifyWsToken as jest.Mock).mockResolvedValue(1);
            await gateway.handleConnection(socket);
            expect(authService.verifyWsToken).toHaveBeenCalledWith('validtoken');
            expect(socket.data.user).toEqual(1);
            expect(gateway['userSockets'].has(1)).toBe(true);
            expect(gateway['userSockets'].get(1)).toContain(socket.id);
            expect(gateway['socketsMap'].has(socket.id)).toBe(true);
        });

        it('handleDisconnect: 소켓 연결 해제 시 구독 정보를 메모리에서 해제', async () => {
            const socket = createMockSocket('socket3');
            socket.data.user = 1;
            gateway['subscriptions'].set(socket.id, 'room:foo');
            gateway['userSockets'].set(1, new Set([socket.id]));
            gateway['socketsMap'].set(socket.id, socket);
            await gateway.handleDisconnect(socket);
            expect(gateway['subscriptions'].has(socket.id)).toBe(false);
            expect(gateway['userSockets'].has(1)).toBe(false);
            expect(gateway['socketsMap'].has(socket.id)).toBe(false);
        });
    });

    describe('handleSubscribe', () => {
        it('신규 구독: 구독 중인 room이 없을 때 새로운 room에 정상적으로 join', async () => {
            const socket = createMockSocket('socket-sub-new');
            const payload: SubscribePayloadDto = { eventType: SubEventType.PLAN_DETAIL, id: 123 };
            const roomKey = `${SubEventType.PLAN_DETAIL}:123`;
            const response = await gateway.handleSubscribe(payload, socket);

            expect(socket.join).toHaveBeenCalledWith(roomKey);
            expect(gateway['subscriptions'].get(socket.id)).toBe(roomKey);
            expect(response.status).toBe('success');
        });

        it('동일한 room 재구독: 아무 일도 일어나지 않고 성공 응답을 반환', async () => {
            const socket = createMockSocket('socket-sub-same');
            const payload: SubscribePayloadDto = { eventType: SubEventType.PLAN_DETAIL, id: 123 };
            const roomKey = `${SubEventType.PLAN_DETAIL}:123`;
            gateway['subscriptions'].set(socket.id, roomKey);
            const response = await gateway.handleSubscribe(payload, socket);

            expect(socket.join).not.toHaveBeenCalled();
            expect(socket.leave).not.toHaveBeenCalled();
            expect(gateway['subscriptions'].get(socket.id)).toBe(roomKey);
            expect(response.status).toBe('success');
        });

        it('room 교체: 다른 room을 구독 중일 때, 기존 room을 leave하고 새로운 room에 join', async () => {
            const socket = createMockSocket('socket-sub-same');
            const payload: SubscribePayloadDto = { eventType: SubEventType.PLAN_DETAIL, id: 123 };
            const currentRoomKey = `${SubEventType.PROJECT_CALENDER}:15`;
            const newRoomKey = `${SubEventType.PLAN_DETAIL}:123`;
            gateway['subscriptions'].set(socket.id, currentRoomKey);
            const response = await gateway.handleSubscribe(payload, socket);

            expect(socket.leave).toHaveBeenCalledWith(currentRoomKey);
            expect(socket.join).toHaveBeenCalledWith(newRoomKey);
            expect(gateway['subscriptions'].get(socket.id)).toBe(newRoomKey);
            expect(response.status).toBe('success');
        });
    });

    describe('handleUnsubscribe', () => {
        const roomKey = `${SubEventType.PLAN_DETAIL}:123`;
        it('unsub 이벤트에 대해 room leave 및 구독 정보 메모리에서 해제', async () => {
            const socket = createMockSocket('socket-unsub-success');
            gateway['subscriptions'].set(socket.id, roomKey);

            const payload: SubscribePayloadDto = { eventType: SubEventType.PLAN_DETAIL, id: 123 };
            const response = await gateway.handleUnsubscribe(payload, socket);

            expect(socket.leave).toHaveBeenCalledWith(roomKey);
            expect(gateway['subscriptions'].has(socket.id)).toBe(false);
            expect(response.status).toBe('success');
        });

        it('unsub 이벤트에 대해 구독 중이지 않은 room일 경우', async () => {
            const socket = createMockSocket('socket-unsub-error');
            const payload: SubscribePayloadDto = { eventType: SubEventType.PLAN_DETAIL, id: 123 };
            const response = await gateway.handleUnsubscribe(payload, socket);
            expect(response.status).toBe('error');
        });
    });

    describe('Broadcasting and Banning', () => {
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
            const roomKey = 'event:123';
            const socket = createMockSocket('socket6');
            gateway['subscriptions'].set(socket.id, roomKey);
            gateway['userSockets'].set(123, new Set([socket.id]));
            gateway['socketsMap'].set(socket.id, socket);

            await gateway.handleBanUser(123, roomKey);
            expect(socket.emit).toHaveBeenCalledWith('unsubscribe-forced', {
                roomKey,
                reason: '관리자에 의해 접근이 차단되었습니다.',
            });
            expect(socket.leave).toHaveBeenCalledWith(roomKey);
            expect(gateway['subscriptions'].has(socket.id)).toBe(false);
        });
    });
});
