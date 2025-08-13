import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { EventPayloadDto } from 'src/common/dtos/event-payload.dto';
import { PlansListener } from './plans.listener';
import { RealTimeEntity, RealTimeType } from 'src/common/response/real-time-response.dto';
import { AppGateway } from 'src/infra/gateway/app.gateway';
import { SubEventType } from 'src/common/enums/sub-event-type.enum';

describe('PlansListener', () => {
    let listener: PlansListener;
    let eventEmitter: EventEmitter2;
    let consoleLogSpy: jest.SpyInstance;

    const mockGateway = {
        handlePublish: jest.fn(),
        handleBanUser: jest.fn(),
    };

    beforeEach(async () => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        const module: TestingModule = await Test.createTestingModule({
            imports: [
                EventEmitterModule.forRoot({
                    wildcard: true,
                    delimiter: '.',
                }),
            ],
            providers: [
                PlansListener,
                {
                    provide: AppGateway,
                    useValue: mockGateway,
                },
            ],
        }).compile();

        listener = module.get<PlansListener>(PlansListener);
        eventEmitter = module.get<EventEmitter2>(EventEmitter2);
        await module.init();

        mockGateway.handlePublish.mockClear();
        mockGateway.handleBanUser.mockClear();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    it('check eventEmitter and listener', () => {
        expect(listener).toBeDefined();
        expect(eventEmitter).toBeDefined();
    });

    describe('plan.deleted 이벤트', () => {
        const entity = RealTimeEntity.PLAN;
        it('삭제 이벤트 처리', async () => {
            // 1. Arrange (테스트 준비)
            const payload: EventPayloadDto = EventPayloadDto.from(RealTimeType.DELETED, {
                projectId: 100,
                plan: { id: 123 },
            });
            const projectId = payload.data.projectId;
            const planId = payload.data.plan.id;
            const result = payload.data.plan;

            // 2. Act (테스트 실행)
            await eventEmitter.emitAsync(`${entity}.${payload.type}`, payload);
            await new Promise((resolve) => setImmediate(resolve));

            // 3. Assert (결과 검증)
            expect(consoleLogSpy).toHaveBeenCalledWith('일정 삭제 동기화 이벤트');
            // AppGateway.hadlePublish의 호출 확인
            expect(mockGateway.handlePublish).toHaveBeenCalledTimes(2);

            // 호출 인자 검증 - 일정 상세페이지
            expect(mockGateway.handlePublish).toHaveBeenCalledWith(
                `${SubEventType.PLAN_DETAIL}:${planId}`,
                expect.objectContaining({
                    payload: result,
                })
            );
            // AppGateway.handleBanUser의 호출 확인
            expect(mockGateway.handleBanUser).toHaveBeenCalledTimes(1);
            // 호출 인자 검증 - 팀 캘린더
            expect(mockGateway.handlePublish).toHaveBeenCalledWith(
                `${SubEventType.PROJECT_CALENDER}:${projectId}`,
                expect.objectContaining({
                    payload: result,
                })
            );
        });
    });

    describe('plan.created 이벤트', () => {
        const entity = RealTimeEntity.PLAN;
        it('생성 이벤트 처리', async () => {
            // 1. Arrange (테스트 준비)
            const payload: EventPayloadDto = EventPayloadDto.from(RealTimeType.CREATED, {
                projectId: 100,
                plan: { id: 123, date: '2025-08-13T10:00:00.000Z' },
            });
            const projectId = payload.data.projectId;
            const result = payload.data.plan;

            // 2. Act (테스트 실행)
            await eventEmitter.emitAsync(`${entity}.${payload.type}`, payload);
            await new Promise((resolve) => setImmediate(resolve));

            // 3. Assert (결과 검증)
            expect(consoleLogSpy).toHaveBeenCalledWith('일정 생성 동기화 이벤트');
            // AppGateway.hadlePublish의 호출 확인
            expect(mockGateway.handlePublish).toHaveBeenCalledTimes(1);
            // 호출 인자 검증 - 팀 캘린더 / 일정 id, 이름, 날짜
            expect(mockGateway.handlePublish).toHaveBeenCalledWith(
                `${SubEventType.PROJECT_CALENDER}:${projectId}`,
                expect.objectContaining({
                    payload: result,
                })
            );
        });
    });

    describe('plan.updated 이벤트', () => {
        const entity = RealTimeEntity.PLAN;
        it('이름/날짜 수정', async () => {
            // 1. Arrange (테스트 준비)
            const payload: EventPayloadDto = EventPayloadDto.from(RealTimeType.UPDATED, {
                projectId: 100,
                plan: { id: 123, name: 'bar' },
            });
            const projectId = payload.data.projectId;
            const planId = payload.data.plan.id;
            const result = payload.data.plan;

            // 2. Act (테스트 실행)
            await eventEmitter.emitAsync(`${entity}.${payload.type}`, payload);
            await new Promise((resolve) => setImmediate(resolve));

            // 3. Assert (결과 검증)
            expect(consoleLogSpy).toHaveBeenCalledWith('일정 수정 동기화 이벤트');
            // AppGateway.hadlePublish의 호출 확인
            expect(mockGateway.handlePublish).toHaveBeenCalledTimes(2);

            // 호출 인자 검증 - 일정 상세페이지
            expect(mockGateway.handlePublish).toHaveBeenCalledWith(
                `${SubEventType.PLAN_DETAIL}:${planId}`,
                expect.objectContaining({
                    payload: result,
                })
            );
            // 호출 인자 검증 - 팀 캘린더
            expect(mockGateway.handlePublish).toHaveBeenCalledWith(
                `${SubEventType.PROJECT_CALENDER}:${projectId}`,
                expect.objectContaining({
                    payload: result,
                })
            );
        });

        it('그 외 필드 수정', async () => {
            // 1. Arrange (테스트 준비)
            const payload: EventPayloadDto = EventPayloadDto.from(RealTimeType.UPDATED, {
                projectId: 100,
                plan: { id: 123, foo: 'bar' },
            });
            const planId = payload.data.plan.id;
            const result = payload.data.plan;

            // 2. Act (테스트 실행)
            await eventEmitter.emitAsync(`${entity}.${payload.type}`, payload);
            await new Promise((resolve) => setImmediate(resolve));

            // 3. Assert (결과 검증)
            expect(consoleLogSpy).toHaveBeenCalledWith('일정 수정 동기화 이벤트');
            // AppGateway.hadlePublish의 호출 확인
            expect(mockGateway.handlePublish).toHaveBeenCalledTimes(1);

            // 호출 인자 검증 - 일정 상세페이지
            expect(mockGateway.handlePublish).toHaveBeenCalledWith(
                `${SubEventType.PLAN_DETAIL}:${planId}`,
                expect.objectContaining({
                    payload: result,
                })
            );
        });
    });
});
