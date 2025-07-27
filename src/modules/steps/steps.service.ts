import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Step } from './entities/steps.entity';
import { Project } from '../projects/entities/projects.entity';
import { Repository } from 'typeorm';
import { CreateStepDto, CreateStepResponseDto } from './dtos/create-step.dto';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { CommonResponse } from '../../common/response/common-response.dto';
import { ProjectNotFoundException } from 'src/common/exceptions/custom.errors';
import { UpdateStepDto, UpdateStepResponseDto } from './dtos/update-step.dto';
import {
    StepNotFoundException,
    TaskNotFoundException,
    StepDeleteForBiddenException
} from '../../common/exceptions/custom.errors';
import { Task } from '../tasks/tasks.entity';
import { UpdateTaskStepDto, UpdateTaskStepResponseDto } from './dtos/update-task-step.dto';

@Injectable()
export class StepsService {
    constructor(
        @InjectRepository(Step)
        private readonly stepRepository: Repository<Step>,
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>
    ) {}

    async createStep(
        dto: CreateStepDto,
        projectId: number
    ): Promise<CommonResponse<CreateStepResponseDto>> {
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

        return CommonResponse.success(CreateStepResponseDto.fromEntity(savedStep));
    }

    async updateStep(
        stepId: number,
        dto: UpdateStepDto
    ): Promise<CommonResponse<UpdateStepResponseDto>> {
        const step = await this.stepRepository.findOne({ where: { id: stepId } });
        if (!step) {
            throw new StepNotFoundException();
        }

        step.name = dto.name;
        const updatedStep = await this.stepRepository.save(step);

        return CommonResponse.success(UpdateStepResponseDto.fromEntity(updatedStep, stepId));
    }

    async updateTaskStep(
        dto: UpdateTaskStepDto,
        stepId: number,
        taskId: number
    ): Promise<CommonResponse<UpdateTaskStepResponseDto>> {
        const { newStepId } = dto;
        // 1) task 조회 + 현재 stepId 일치 여부 확인
        const raw = await this.taskRepository
            .createQueryBuilder('task')
            .leftJoin('task.step', 's')
            .select(['task.id AS task_id', 's.id AS current_step_id'])
            .where('task.id = :taskId', { taskId })
            .andWhere('s.id = :stepId', { stepId })
            .getRawOne();

        if (!raw) throw new TaskNotFoundException();

        // 2) 이동할 step 존재 여부 확인
        const stepRaw = await this.stepRepository
            .createQueryBuilder('step')
            .leftJoin('step.project', 'p')
            .select(['step.id AS step_id', 'p.id AS project_id'])
            .where('step.id = :newStepId', { newStepId })
            .getRawOne();

        if (!stepRaw) throw new StepNotFoundException();

        // 3) 실제로 Task.step 컬럼만 업데이트
        await this.taskRepository
            .createQueryBuilder()
            .update(Task)
            .set({ step: { id: newStepId } })
            .where('id = :taskId', { taskId })
            .execute();

        // 4) DTO 생성하여 반환
        return CommonResponse.success(UpdateTaskStepResponseDto.fromEntity(taskId, newStepId));
    }

    async deleteStep(stepId:number):Promise<CommonResponse>{
        //step 존재 여부 확인
        const stepRaw = await this.stepRepository
            .createQueryBuilder('step')
            .where('step.id = :stepId', { stepId })
            .getRawOne();
        if(!stepRaw) throw new StepNotFoundException();
        // stepId로 연결된 task 조회
    const raw = await this.taskRepository
        .createQueryBuilder('task')
        .leftJoin('task.step', 's')
        .select(['task.id AS task_id'])
        .where('s.id = :stepId', { stepId })
        .getRawMany();

    // 연결된 task가 하나라도 있으면 삭제 불가
    if (raw.length > 0) {
        throw new StepDeleteForBiddenException();
    }

    // 실제 삭제 로직 (예: soft delete 또는 hard delete 등)
    await this.stepRepository.delete({ id: stepId });
    return CommonResponse.success({message: `스텝 ID ${stepId} 삭제 완료`})
    }
}
