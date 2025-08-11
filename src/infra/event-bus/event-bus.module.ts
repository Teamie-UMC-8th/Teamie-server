import { Global, Module } from '@nestjs/common';
import { EventBusService } from './event-bus.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Global()
@Module({
    imports: [
        EventEmitterModule.forRoot({
            wildcard: true,
            delimiter: '.',
        }),
    ],
    providers: [EventBusService],
    exports: [EventEmitterModule, EventBusService],
})
export class EventBusModule {}
