import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskFile } from './task-files.entity';
import { TaskFilesController } from './task-files.controller';
import { TaskFilesService } from './task-files.service';
import { TaskFileRepository } from './repositories/task-file.repository';
import { UploadModule } from 'src/infra/upload/upload.module';
@Module({
    imports: [TypeOrmModule.forFeature([TaskFile]), UploadModule],
    controllers: [TaskFilesController],
    providers: [TaskFilesService, TaskFileRepository],
    exports: [TaskFilesService, TaskFileRepository],
})
export class TaskFilesModule {}
