import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './services/tasks.service';
import { Task } from './entities/tasks.entity';
import { Step } from '../steps/entities/steps.entity';
import { UserProject } from '../projects/entities/userProjects.entity';
import { ConfigModule } from '@nestjs/config';
import { Manager } from '../mappings/managers/managers.entity';
import { TaskFile } from '../mappings/task-files/task-files.entity';
import { UploadService } from '../../infra/upload/upload.service';
import { Project } from '../projects/entities/projects.entity';
import { Comment } from '../comments/entities/comments.entity';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Task, Step, UserProject, Manager, TaskFile, Project, Comment]),
        ConfigModule,
        UsersModule,
    ],
    controllers: [TasksController],
    providers: [TasksService, UploadService],
    exports: [TasksService],
})
export class TasksModule {}
