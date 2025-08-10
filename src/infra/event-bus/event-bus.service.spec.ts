import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { EventBusService } from './event-bus.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('EventBusService', () => {
    let service: EventBusService;
    let eventEmitter: EventEmitter2;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [EventEmitterModule.forRoot()],
            providers: [EventBusService],
        }).compile();

        service = module.get<EventBusService>(EventBusService);
        eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    });

    it('이벤트 발행 시 리스너가 이벤트를 잘 받는지 테스트', (done) => {
        eventEmitter.on('test.event', (payload) => {
            expect(payload).toEqual({ foo: 'bar' });
            done();
        });

        service.publish('test.event', { foo: 'bar' });
    });
});
