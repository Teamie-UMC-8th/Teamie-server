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
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    it('check eventEmitter and listener', () => {
        expect(listener).toBeDefined();
        expect(eventEmitter).toBeDefined();
    });

    describe('이벤트 pub에 대한 리스너 작동 테스트', () => {
        it('plan.deleted 이벤트 발생', async () => {
            // 1. Arrange (테스트 준비)
            const payload: EventPayloadDto = EventPayloadDto.from(RealTimeType.DELETED, {
                foo: 'bar',
            });

            // 2. Act (테스트 실행)
            await eventEmitter.emitAsync(`${RealTimeEntity.PLAN}.${payload.type}`, payload);
            await new Promise((resolve) => setImmediate(resolve));

            // 3. Assert (결과 검증)
            expect(consoleLogSpy).toHaveBeenCalledWith('일정 삭제 동기화 이벤트');
            // AppGateway.hadlePublish의 호출 확인
            expect(mockGateway.handlePublish).toHaveBeenCalledTimes(2);

            // 호출 인자 검증 - 일정 상세페이지
            expect(mockGateway.handlePublish).toHaveBeenCalledWith(
                `${SubEventType.PLAN_DETAIL}:${payload.data.planId}`,
                expect.anything()
            );
            // 호출 인자 검증 - 팀 캘린더
            expect(mockGateway.handlePublish).toHaveBeenCalledWith(
                `${SubEventType.PROJECT_CALENDER}:${payload.data.projectId}`,
                expect.anything()
            );
        });
    });
});
