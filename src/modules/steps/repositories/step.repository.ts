import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    //step 조회 with queryRunner
    async findByIdWithQueryRunner(queryRunner: QueryRunner, stepId: number): Promise<Step> {
        const step = await queryRunner.manager.findOne(Step, {
            where: { id: stepId },
            relations: ['project'],
        });

        if (!step) {
            throw new StepNotFoundException();
        }

        return step;
    }

    async findByProjectId(projectId: number): Promise<Step[]> {
        const steps = await this.repo.find({
            where: { project: { id: projectId } },
            relations: ['project'],
            order: {
                createdAt: 'ASC',
            },
        });

        if (!steps || steps.length === 0) {
            throw new StepNotFoundException();
        }

        return steps;
    }
}
