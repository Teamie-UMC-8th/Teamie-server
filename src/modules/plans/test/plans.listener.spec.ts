import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { EventPayloadDto } from 'src/common/dtos/event-payload.dto';
import { PlansListener } from '../listener/plans.listener';
import { RealTimeEntity, RealTimeType } from 'src/common/response/real-time-response.dto';

describe('PlansListener', () => {
    let listener: PlansListener;
    let eventEmitter: EventEmitter2;
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(async () => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        const module: TestingModule = await Test.createTestingModule({
            imports: [
                EventEmitterModule.forRoot({
                    wildcard: true,
                    delimiter: '.',
                }),
            ],
            providers: [PlansListener],
        }).compile();

        listener = module.get<PlansListener>(PlansListener);
        eventEmitter = module.get<EventEmitter2>(EventEmitter2);
        await module.init();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    it('check eventEmitter and listener', () => {
        expect(listener).toBeDefined();
        expect(eventEmitter).toBeDefined();
    });

    describe('handlePlan', () => {
        it('plan.delete 이벤트 호출 시 예상대로 작동하는지 테스트', async () => {
            // 1. Arrange (테스트 준비)
            const payload: EventPayloadDto = EventPayloadDto.from(RealTimeType.DELETED, {
                foo: 'bar',
            });

            // 2. Act (테스트 실행)
            await eventEmitter.emitAsync(`${RealTimeEntity.PLAN}.${payload.type}`, payload);
            await new Promise((resolve) => setImmediate(resolve));

            // 3. Assert (결과 검증)
            expect(consoleLogSpy).toHaveBeenCalledTimes(1);
            expect(consoleLogSpy).toHaveBeenCalledWith(
                'Plan event:',
                expect.objectContaining({
                    type: payload.type,
                    entity: RealTimeEntity.PLAN,
                    payload: payload.data,
                })
            );
        });
    });
});
