import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { TaskFile } from '../task-files.entity';
import { TaskFileNotFoundException } from '../../../../common/exceptions/custom.errors';
export class TaskFileRepository {
    constructor(@InjectRepository(TaskFile) private readonly repo: Repository<TaskFile>) {}

    // taskFile 삭제
    async deleteTaskFileWithQueryRunner(
        queryRunner: QueryRunner,
        taskFileId: number
    ): Promise<void> {
        await queryRunner.manager.delete(TaskFile, { id: taskFileId });
    }

    // taskFile 저장
    async saveTaskFileWithQueryRunner(
        queryRunner: QueryRunner,
        taskFile: TaskFile
    ): Promise<TaskFile> {
        return queryRunner.manager.save(TaskFile, taskFile);
    }

    //taskFile 조회
    async findTaskFileByIdWithQueryRunner(
        queryRunner: QueryRunner,
        taskFileId: number
    ): Promise<TaskFile> {
        const taskFile = await queryRunner.manager.findOne(TaskFile, {
            where: { id: taskFileId },
            relations: ['task'],
            select: { id: true, fileUrl: true, task: { id: true } },
        });

        if (!taskFile) {
            throw new TaskFileNotFoundException();
        }

        return taskFile;
    }

    // taskFiles 조회
    async findTaskFilesByIdWithQueryRunner(
        queryRunner: QueryRunner,
        taskId: number
    ): Promise<TaskFile[]> {
        return queryRunner.manager.find(TaskFile, {
            where: { task: { id: taskId } },
        });
    }
}
