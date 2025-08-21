import { Module } from '@nestjs/common';
import { AuthModule } from 'src/modules/auth/auth.module';
import { AppGateway } from './app.gateway';
import { EventBusModule } from '../event-bus/event-bus.module';

@Module({
    imports: [AuthModule, EventBusModule],
    providers: [AppGateway],
    exports: [AppGateway],
})
export class GateWayModule {}
