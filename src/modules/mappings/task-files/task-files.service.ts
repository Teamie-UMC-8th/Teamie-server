import { Injectable } from '@nestjs/common';
import { UploadService } from '../../../infra/upload/upload.service';
import { TaskFileNotFoundException } from 'src/common/exceptions/custom.errors';
import { InternalServerErrorException } from '@nestjs/common';
import { TaskFileRepository } from './repositories/task-file.repository';
import { QueryRunner } from 'typeorm';
import { CommonResponse } from 'src/common/response/common-response.dto';

@Injectable()
export class TaskFilesService {
    constructor(
        private readonly uploadService: UploadService,

        private readonly taskFileRepository: TaskFileRepository
    ) {}

    async deleteTaskFile(
        queryRunner: QueryRunner,
        userId: number,
        fileId: number
    ): Promise<CommonResponse> {
        const file = await this.taskFileRepository.findTaskFileByIdWithQueryRunner(
            queryRunner,
            fileId
        );

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

        await this.taskFileRepository.deleteTaskFileWithQueryRunner(queryRunner, fileId);
        return CommonResponse.success({ message: `업무 파일 ID ${fileId} 삭제 완료` });
    }
}
