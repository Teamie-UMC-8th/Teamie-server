import { Delete, Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { CommonResponse } from '../../../common/response/common-response.dto';
import { UpdateStepDto, UpdateStepResponseDto } from '../dtos/update-step.dto';
import {
    StepNotFoundException,
    TaskNotFoundException,
    StepDeleteForBiddenException,
} from '../../../common/exceptions/custom.errors';
import { Task } from '../../tasks/entities/tasks.entity';
import { UpdateTaskStepDto, UpdateTaskStepResponseDto } from '../dtos/update-task-step.dto';
import { StepRepository } from '../repositories/step.repository';
import { TaskRepository } from 'src/modules/tasks/repositories/task.repository';
import { EventBusService } from 'src/infra/event-bus/event-bus.service';
import { RealTimeEntity, RealTimeType } from 'src/common/response/real-time-response.dto';
import { EventPayloadDto } from 'src/common/dtos/event-payload.dto';
import { DeletedStepDTO, UpdatedStepDTO } from '../dtos/step-payload.dto';
import { UpdatedTaskStepDTO } from 'src/modules/tasks/dtos/task-payload.dto';
import { TaskUpdatedSubType } from 'src/modules/tasks/enums/task-update-type.enum';
@Injectable()
export class StepsService {
    constructor(
        private readonly stepRepository: StepRepository,
        private readonly taskRepository: TaskRepository,
        private readonly eventBus: EventBusService
    ) {}
    async updateStep(
        qr: QueryRunner,
        stepId: number,
        dto: UpdateStepDto
    ): Promise<UpdateStepResponseDto> {
        const step = await this.stepRepository.findByIdUsingQR(qr.manager, stepId);
        step.name = dto.name;
        const updatedStep = await this.stepRepository.saveStep(qr.manager, step);
        await this.eventBus.publishAsync(
            `${RealTimeEntity.STEP}.${RealTimeType.UPDATED}`,
            EventPayloadDto.from(RealTimeType.UPDATED, {
                step: UpdatedStepDTO.from(step.project.id, updatedStep),
            })
        );
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
        const step = await this.stepRepository.findByIdWithTask(qr.manager, stepId);
        // NOTE: 이건 객체에서 인메모리 탐색을 하는 것보다는 쿼리로 만드는게 더 좋을 것 같아요
        const hasTask = step.tasks.some((task) => task.id === taskId);
        if (!hasTask) {
            throw new TaskNotFoundException();
        }

        // 2) 이동할 step 존재 여부 확인
        const newStep = await this.stepRepository.findByIdUsingQR(qr.manager, newStepId);
        if (newStep.project.id !== step.project.id) {
            throw new StepNotFoundException(
                '이동할 스텝이 현재 스텝과 같은 프로젝트에 속하지 않습니다.'
            );
        }

        // 3) 실제로 Task.step 컬럼만 업데이트
        const partial = qr.manager.create(Task, {
            id: taskId,
            step: { id: newStepId } as any,
        });
        await this.taskRepository.saveWithQueryRunner(qr.manager, partial);
        await this.eventBus.publishAsync(
            `${RealTimeEntity.TASK}.${RealTimeType.UPDATED}.${TaskUpdatedSubType.STEP}`,
            EventPayloadDto.from(RealTimeType.UPDATED, {
                task: UpdatedTaskStepDTO.from(newStep.project.id, partial.id, newStepId),
            })
        );

        // 4) DTO 생성하여 반환
        return UpdateTaskStepResponseDto.fromEntity(taskId, newStepId);
    }

    async deleteStep(qr: QueryRunner, stepId: number): Promise<CommonResponse> {
        //step 존재 여부 확인
        const stepRaw = await this.stepRepository.findByIdUsingQR(qr.manager, stepId);
        // stepId로 연결된 task 조회
        const raw = await this.stepRepository.findByIdWithTask(qr.manager, stepId);

        // 연결된 task가 하나라도 있으면 삭제 불가
        if (raw.tasks.length > 0) {
            throw new StepDeleteForBiddenException();
        }

        // 실제 삭제 로직 (예: soft delete 또는 hard delete 등)
        await this.stepRepository.deleteById(qr.manager, stepRaw.id);
        await this.eventBus.publishAsync(
            `${RealTimeEntity.STEP}.${RealTimeType.DELETED}`,
            EventPayloadDto.from(RealTimeType.DELETED, {
                step: DeletedStepDTO.from(stepRaw.project.id, stepId),
            })
        );
        return CommonResponse.success({ message: `스텝 ID ${stepId} 삭제 완료` });
    }
}
