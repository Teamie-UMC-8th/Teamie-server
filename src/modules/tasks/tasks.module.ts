import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './tasks.entity';
import { Step } from '../steps/entities/steps.entity';
import { UserProject } from '../mappings/user-projects/userProjects.entity';
import { ConfigModule } from '@nestjs/config';
import { Manager } from '../mappings/managers/managers.entity';
import { TaskFile } from '../mappings/task-files/task-files.entity';
import { UploadService } from '../../infra/upload/upload.service';

@Module({
    imports: [TypeOrmModule.forFeature([Task, Step, UserProject, Manager, TaskFile]), ConfigModule],
    controllers: [TasksController],
    providers: [TasksService, UploadService],
})
export class TasksModule {}
