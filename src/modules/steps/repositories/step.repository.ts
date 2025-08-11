import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Step } from '../../steps/entities/steps.entity';
import { StepNotFoundException } from 'src/common/exceptions/custom.errors';
import { QueryRunner } from 'typeorm';

@Injectable()
export class StepRepository {
    constructor(
        @InjectRepository(Step)
        private readonly repo: Repository<Step>
    ) {}

    //step 조회
    async findById(stepId: number): Promise<Step> {
        const step = await this.repo.findOne({
            where: { id: stepId },
            relations: ['project'],
        });

        if (!step) {
            throw new StepNotFoundException();
        }

        return step;
    }

    async findByIdWithTask(manager: EntityManager, stepId: number): Promise<Step> {
        const step = await manager.getRepository(Step).findOne({
            where: { id: stepId },
            relations: ['project', 'tasks'], // ⬅ task 관계도 같이 로드
        });

        if (!step) {
            throw new StepNotFoundException();
        }
        return step;
    }

    //step 조회 with queryRunner
    async findByIdUsingQR(manager: EntityManager, stepId: number): Promise<Step> {
        const step = await manager.findOne(Step, {
            where: { id: stepId },
            relations: ['project'], // 필요에 따라 relations 제거 가능
        });

        if (!step) {
            throw new StepNotFoundException();
        }

        return step;
    }

    async findByProjectId(projectId: number): Promise<Step[]> {
        return this.repo.find({
            where: { project: { id: projectId } },
            relations: ['project'],
            order: {
                createdAt: 'ASC',
            },
        });
    }

    async saveStep(manager: EntityManager, step: Step): Promise<Step> {
        return await manager.save(Step, step);
    }

    async deleteById(manager: EntityManager, stepId: number): Promise<void> {
        await manager.delete(Step, { id: stepId });
    }
}
