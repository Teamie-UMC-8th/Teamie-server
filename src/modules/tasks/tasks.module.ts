import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './services/tasks.service';
import { Task } from './entities/tasks.entity';
import { Manager } from './entities/managers.entity';
import { UsersModule } from '../users/users.module';
import { TaskRepository } from './repositories/task.repository';
import { ProjectsModule } from '../projects/projects.module';
import { UserProjectimport { GateWayModule } from 'src/infra/gateway/gateway.module';
import { TasksListener } from './listener/tasks.listener';
import { ManagerRepository } from './repositories/manager.repository';
import { StepsModule } from '../steps/steps.module';
import { TaskFilesModule } from './task-files/task-files.module';
import { CommentsModule } from '../comments/comments.module';
import { UploadModule } from 'src/infra/upload/upload.module';
@Module({
    imports: [
        TypeOrmModule.forFeature([Task, Manager]),
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
        forwardRef(() => StepsModule),
        TaskFilesModule,
        CommentsModule,
        UserProjectModule,
        UploadModule,
    ],
    controllers: [TasksController],
    providers: [TasksService, ManagerRepository, TaskRepository],
    exports: [TaskRepository, ManagerRepository, TasksService],
})
export class TasksModule {}
