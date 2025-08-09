import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { Manager } from '../managers.entity';

export class ManagerRepository {
    constructor(@InjectRepository(Manager) private readonly repo: Repository<Manager>) {}

    // taskId로 manager 삭제
    async deleteManagerWithQueryRunner(queryRunner: QueryRunner, taskId: number): Promise<void> {
        await queryRunner.manager.delete(Manager, { task: { id: taskId } });
    }

    // manager 저장
    async saveManagersWithQueryRunner(
        queryRunner: QueryRunner,
        managers: Manager[]
    ): Promise<Manager[]> {
        return queryRunner.manager.save(Manager, managers);
    }

    //manager 조회
    async findManagersByTaskIdWithQueryRunner(
        queryRunner: QueryRunner,
        taskId: number
    ): Promise<Manager[]> {
        return queryRunner.manager.find(Manager, {
            where: { task: { id: taskId } },
            relations: ['user'],
            select: {
                id: true,
                user: { id: true, name: true },
            },
        });
    }
}
