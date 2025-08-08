import { forwardRef, Module } from '@nestjs/common';
import { PlansGateway } from './gateways/plans.gateway';
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

@Module({
    imports: [
        TypeOrmModule.forFeature([Plan]),
        forwardRef(() => ProjectsModule),
        AuthModule,
        UsersModule,
    ],
    controllers: [PlansController],
    providers: [PlansGateway, PlansService, PlanRepository, WriterRepository, AttendeeRepository],
    exports: [PlansService],
})
export class PlansModule {}
