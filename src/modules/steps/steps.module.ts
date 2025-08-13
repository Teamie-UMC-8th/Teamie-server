import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StepsController } from './steps.controller';
import { StepsService } from './services/steps.service';
import { Step } from './entities/steps.entity';
import { ProjectsModule } from '../projects/projects.module';
import { StepRepository } from './repositories/step.repository';
import { TasksModule } from '../tasks/tasks.module';
import { StepsListener } from './listener/steps.listener';
import { GateWayModule } from 'src/infra/gateway/gateway.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Step]),
        forwardRef(() => ProjectsModule), // Circular dependency handling
        forwardRef(() => TasksModule),
        GateWayModule,
    ],
    controllers: [StepsController],
    providers: [StepRepository, StepsService, StepsListener],
    exports: [StepRepository, StepsService],
})
export class StepsModule {}
