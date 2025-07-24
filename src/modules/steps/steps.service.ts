import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Step } from './entities/steps.entity';
import { Project } from '../projects/entities/projects.entity';
import { Repository } from 'typeorm';
import { CreateStepDto } from './dtos/create-step.dto';
import { StepWithTaskDto } from './dtos/step-with-task.dto';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { CommonResponse } from '../../common/response/common-response.dto';
import { ProjectNotFoundException } from 'src/common/exceptions/custom.errors';
import { UpdateStepDto, UpdateStepResponseDto } from './dtos/update-step.dto';
import { StepNotFoundException } from '../../common/exceptions/custom.errors';

@Injectable()
export class StepsService {
    constructor(
        @InjectRepository(Step)
        private readonly stepRepository: Repository<Step>,
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>
    ) {}

    async createStep(
        dto: CreateStepDto,
        projectId: number
    ): Promise<CommonResponse<StepWithTaskDto>> {
        const { name } = dto;

        const project = await this.projectRepository.findOne({ where: { id: projectId } });
        if (!project) {
            throw new ProjectNotFoundException();
        }

        const step = this.stepRepository.create({
            name,
            project: { id: projectId },
        });

        const savedStep = await this.stepRepository.save(step);

        return CommonResponse.success(StepWithTaskDto.fromEntity(savedStep));
    }

    async updateStep(
        stepId: number,
        dto: UpdateStepDto,
        userId: number
    ): Promise<CommonResponse<UpdateStepResponseDto>> {
        const step = await this.stepRepository.findOne({ where: { id: stepId } });
        if (!step) {
            throw new StepNotFoundException();
        }

        step.name = dto.name;
        const updatedStep = await this.stepRepository.save(step);

        return CommonResponse.success(UpdateStepResponseDto.fromEntity(updatedStep, stepId));
    }
}
