import { Module } from '@nestjs/common';
import { PlansGateway } from './gateways/plans.gateway';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './plans.entity';
import { ProjectsModule } from '../projects/projects.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Plan]),
        ProjectsModule
    ],
    controllers: [PlansController],
    providers: [PlansGateway, PlansService],
})
export class PlansModule {}
