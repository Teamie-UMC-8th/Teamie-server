import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './services/tasks.service';
import { Task } from './entities/tasks.entity';
import { Step } from '../steps/entities/steps.entity';
import { UserProject } from '../projects/user-projects/entities/user-projects.entity';
import { ConfigModule } from '@nestjs/config';
import { Manager } from '../mappings/managers/managers.entity';
import { TaskFile } from '../mappings/task-files/task-files.entity';
import { UploadService } from '../../infra/upload/upload.service';
import { Project } from '../projects/entities/projects.entity';
import { Comment } from '../comments/entities/comments.entity';
import { UsersModule } from '../users/users.module';
import { TaskRepository } from './repositories/task.repository';
import { CommentRepository } from '../comments/repositories/comments.repository';
import { StepRepository } from '../steps/repositories/step.repository';
import { TaskFileRepository } from '../mappings/task-files/repositories/task-file.repository';
import { ManagerRepository } from '../mappings/managers/repositories/manager.repository';
import { ProjectsModule } from '../projects/projects.module';
import { UserProjectModule } from '../projects/user-projects/user-project.module';
import { GateWayModule } from 'src/infra/gateway/gateway.module';
import { TasksListener } from './listener/tasks.listener';
@Module({
    imports: [
        TypeOrmModule.forFeature([Task, Step, UserProject, Manager, TaskFile, Project, Comment]),
        ConfigModule,
        UsersModule,
        forwardRef(() => ProjectsModule),
        UserProjectModule,
        GateWayModule,
    ],
    controllers: [TasksController],
    providers: [
        TasksService,
        UploadService,
        ManagerRepository,
        TaskRepository,
        CommentRepository,
        StepRepository,
        TaskFileRepository,
        TasksListener,
    ],
    exports: [
        TaskRepository,
        CommentRepository,
        TaskFileRepository,
        ManagerRepository,
        TasksService,
    ],
})
export class TasksModule {}
