import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventBusService {
    constructor(private eventEmitter: EventEmitter2) {}

    publish<T>(event: string, payload: T) {
        this.eventEmitter.emit(event, payload);
    }

    async publishAsync<T>(event: string, payload: T) {
        return this.eventEmitter.emitAsync(event, payload);
    }
}
