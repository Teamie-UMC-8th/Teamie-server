import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StepsController } from './steps.controller';
import { StepsService } from './steps.service';
import { Step } from './entities/steps.entity';
import { Project } from '../projects/entities/projects.entity';
import { ProjectsModule } from '../projects/projects.module';
import { RedisModule } from '../../infra/redis/redis.module';
import { Task } from '../tasks/entities/tasks.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Step, Project, Task]),
        forwardRef(() => ProjectsModule), // Circular dependency handling
        RedisModule,
    ],
    controllers: [StepsController],
    providers: [StepsService],
    exports: [StepsService],
})
export class StepsModule {}
