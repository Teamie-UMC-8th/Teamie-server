import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../../tasks/entities/tasks.entity';
import { ConfigModule } from '@nestjs/config';
import { TaskFile } from './task-files.entity';
import { UploadService } from '../../../infra/upload/upload.service';
import { TaskFilesController } from './task-files.controller';
import { TaskFilesService } from './task-files.service';
import { TaskFileRepository } from './repositories/task-file.repository';
@Module({
    imports: [TypeOrmModule.forFeature([Task, TaskFile]), ConfigModule],
    controllers: [TaskFilesController],
    providers: [TaskFilesService, UploadService, TaskFileRepository],
    exports: [TaskFilesService, TaskFileRepository],
})
export class TaskFilesModule {}
