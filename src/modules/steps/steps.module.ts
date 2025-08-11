import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StepsController } from './steps.controller';
import { StepsService } from './services/steps.service';
import { Step } from './entities/steps.entity';
import { Project } from '../projects/entities/projects.entity';
import { ProjectsModule } from '../projects/projects.module';
import { Task } from '../tasks/entities/tasks.entity';
import { TaskRepository } from '../tasks/repositories/task.repository';
import { StepRepository } from './repositories/step.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([Step, Project, Task]),
        forwardRef(() => ProjectsModule), // Circular dependency handling
    ],
    controllers: [StepsController],
    providers: [StepRepository, StepsService, TaskRepository],
    exports: [StepsService],
})
export class StepsModule {}
