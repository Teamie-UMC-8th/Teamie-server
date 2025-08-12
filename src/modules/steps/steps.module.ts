import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StepsController } from './steps.controller';
import { StepsService } from './services/steps.service';
import { Step } from './entities/steps.entity';
import { ProjectsModule } from '../projects/projects.module';
import { StepRepository } from './repositories/step.repository';
import { TasksModule } from '../tasks/tasks.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Step]),
        forwardRef(() => ProjectsModule), // Circular dependency handling
        forwardRef(() => TasksModule),
    ],
    controllers: [StepsController],
    providers: [StepRepository, StepsService],
    exports: [StepRepository, StepsService],
})
export class StepsModule {}
