import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Task } from '../../tasks/tasks.entity';
import { TaskFile } from './task-files.entity';
import { UploadService } from '../../../infra/upload/upload.service';
import { TaskFileNotFoundException } from 'src/common/exceptions/custom.errors';
import { InternalServerErrorException } from '@nestjs/common';
@Injectable()
export class TaskFilesService {
    constructor(
        private readonly uploadService: UploadService,

        @InjectRepository(TaskFile)
        private readonly taskFileRepository: Repository<TaskFile>
    ) {}

    async deleteTaskFile(fileId: number, userId: number): Promise<void> {
        const file = await this.taskFileRepository.findOne({
            where: { id: fileId },
            relations: ['user'],
        });

        if (!file) {
            throw new TaskFileNotFoundException('해당 파일을 찾을 수 없습니다.');
        }

        // S3 key 추출
        const key = file.fileUrl.split('.amazonaws.com/')[1];
        if (!key) {
            throw new InternalServerErrorException('S3 파일 키 추출에 실패했습니다.');
        }

        try {
            await this.uploadService.deleteFile(key); // S3 삭제
        } catch (err) {
            console.error('[S3 삭제 실패]', err);
            throw new InternalServerErrorException('S3 파일 삭제에 실패했습니다.');
        }

        await this.taskFileRepository.delete({ id: fileId }); // DB 삭제
    }
}
