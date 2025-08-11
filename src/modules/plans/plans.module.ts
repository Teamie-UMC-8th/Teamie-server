import { forwardRef, Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlansService } from './services/plans.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { ProjectsModule } from '../projects/projects.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { PlanRepository } from './repositories/plan.repository';
import { WriterRepository } from './repositories/writers.repository';
import { AttendeeRepository } from './repositories/attendees.repository';
import { PlansListener } from './listener/plans.listener';
import { EventBusModule } from 'src/infra/event-bus/event-bus.module';
import { GateWayModule } from 'src/infra/gateway/gateway.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Plan]),
        forwardRef(() => ProjectsModule),
        AuthModule,
        UsersModule,
        EventBusModule,
        GateWayModule,
    ],
    controllers: [PlansController],
    providers: [PlansService, PlansListener, PlanRepository, WriterRepository, AttendeeRepository],
    exports: [PlansService],
})
export class PlansModule {}
