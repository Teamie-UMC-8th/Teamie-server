import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Step } from '../entities/steps.entity';
import { Project } from '../../projects/entities/projects.entity';
import { Repository, QueryRunner } from 'typeorm';
import { CreateStepDto, CreateStepResponseDto } from '../dtos/create-step.dto';
import { CommonResponse } from '../../../common/response/common-response.dto';
import { ProjectNotFoundException } from 'src/common/exceptions/custom.errors';
import { UpdateStepDto, UpdateStepResponseDto } from '../dtos/update-step.dto';
import {
    StepNotFoundException,
    TaskNotFoundException,
    StepDeleteForBiddenException,
} from '../../../common/exceptions/custom.errors';
import { Task } from '../../tasks/entities/tasks.entity';
import { UpdateTaskStepDto, UpdateTaskStepResponseDto } from '../dtos/update-task-step.dto';
@Injectable()
export class StepsService {
    constructor(
        private readonly stepRepository: StepRepository,
        private readonly projectRepository: ProjectRepository,
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>
    ) {}

    async updateStep(qr: QueryRunner,stepId: number, dto: UpdateStepDto): Promise<UpdateStepResponseDto> {
        const step = await this.stepRepository.findByIdUsingQR(qr.manager,stepId);
        if (!step) {
            throw new StepNotFoundException();
        }

        step.name = dto.name;
        const updatedStep = await this.stepRepository.saveStep(qr.manager,step);

        return UpdateStepResponseDto.fromEntity(updatedStep, stepId);
    }

    async updateTaskStep(
        qr: QueryRunner,
        dto: UpdateTaskStepDto,
        stepId: number,
        taskId: number
    ): Promise<UpdateTaskStepResponseDto> {
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
        const stepRaw = await this.stepRepository.findByIdUsingQR(qr.manager,newStepId);

        // 3) 실제로 Task.step 컬럼만 업데이트
        await this.taskRepository
            .createQueryBuilder()
            .update(Task)
            .set({ step: { id: newStepId } })
            .where('id = :taskId', { taskId })
            .execute();

        // 4) DTO 생성하여 반환
        return UpdateTaskStepResponseDto.fromEntity(taskId, newStepId);
    }

    async deleteStep(qr:QueryRunner,stepId: number): Promise<CommonResponse> {
        //step 존재 여부 확인
        const stepRaw = await this.stepRepository.findByIdUsingQR(qr.manager, stepId);
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
        await this.stepRepository.deleteById(qr.manager,stepRaw);
        return CommonResponse.success({ message: `스텝 ID ${stepId} 삭제 완료` });
    }
}import { StepRepository } from '../repositories/step.repository';
import { ProjectRepository } from 'src/modules/projects/repositories/project.repository';

