import {BadRequestException, ForbiddenException, NotFoundException, Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial} from 'typeorm';
import { Task } from './tasks.entity';
import { Step } from '../steps/steps.entity';
import { UserProject } from '../mappings/userProjects/userProjects.entity'; 
import { CreateTaskRequestDto, CreateTaskResponseDto  } from './dtos/create-task.dto';
import { UpdateTaskRequestDto , UpdateTaskResponseDto} from './dtos/update-task.dto';
import { Manager} from '../mappings/managers/managers.entity';
import { DeleteTaskResponseDto  } from './dtos/delete-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    @InjectRepository(Step)
    private readonly stepRepository: Repository<Step>,

    @InjectRepository(UserProject)
    private readonly userProjectRepository: Repository<UserProject>,

    @InjectRepository(Manager)
    private readonly managerRepository: Repository<Manager>,
  ) {}

  async createTask(userId: number, createTaskRequestDto: CreateTaskRequestDto): Promise<{ taskId: number }> {
    const { stepId } = createTaskRequestDto;

    const targetStep  = await this.stepRepository.findOne({
      where: { id: stepId },
      relations: ['project'],
    });

    if (!targetStep ) {
      throw new BadRequestException({
        errorCode: 'STEP_NOT_FOUND',
        message: '해당 step이 존재하지 않습니다.',
      });
    }

    const projectId = targetStep .project.id;

    const userPorject = await this.userProjectRepository.findOne({
        where: {
            user: { id: userId },
            project: { id: projectId },
        },
    });

    if (!userPorject) {
        throw new ForbiddenException({
          errorCode: 'NOT_PROJECT_MEMBER',
          message: '프로젝트 참여자가 아닙니다.',
        });
    }

    const task = {
    step: targetStep,
    name: '빈 업무',
    memo: " ",
    deadline: new Date(),
  };
   const saved = await this.taskRepository.save(task);
    return { taskId: saved.id };
  }

  async updateTask(dto: UpdateTaskRequestDto, userId: number, taskId: number) {
  const task = await this.taskRepository.findOne({
    where: { id: taskId },
    relations: ['taskFiles', 'step', 'step.project'],
  });

  if (!task) {
    throw new NotFoundException({
      errorCode: 'TASK_NOT_FOUND',
      message: '수정하려는 업무가 없습니다.',
    });
  }

  if (dto.stepId && dto.stepId !== task.step.id) {
    const newStep = await this.stepRepository.findOne({
      where: { id: dto.stepId },
      relations: ['project'],
    });

    if (!newStep) {
      throw new BadRequestException({
        errorCode: 'STEP_NOT_FOUND',
        message: '이동하려는 step이 존재하지 않습니다.',
      });
    }

    // 이동할 step의 프로젝트 기준으로 참여자 검증
    const userProject = await this.userProjectRepository.findOne({
      where: {
        user: { id: userId },
        project: { id: newStep.project.id },
      },
    });

    if (!userProject) {
      throw new ForbiddenException({
        errorCode: 'NOT_PROJECT_MEMBER',
        message: '해당 step이 포함된 프로젝트에 참여하지 않았습니다.',
      });
    }

    task.step = newStep;
  }

  if (dto.name !== undefined) task.name = dto.name;
  if (dto.deadline !== undefined) task.deadline = new Date(dto.deadline);
  if (dto.status !== undefined) task.status = dto.status;
  if (dto.memo !== undefined) task.memo = dto.memo;

  const updatedTask = await this.taskRepository.save(task);
  if (dto.managerIds !== undefined) {
    await this.managerRepository.delete({ task: { id: updatedTask.id } });

    if (dto.managerIds.length > 0) {
      for (const managerId of dto.managerIds) {
        const manager = this.managerRepository.create({
          user: { id: managerId },
          task: updatedTask,
        });
        await this.managerRepository.save(manager);
      }
    }
  }

  const managers = await this.managerRepository.find({
    where: { task: { id: updatedTask.id } },
    relations: ['user'],
  });

  const responseDto = UpdateTaskResponseDto.from(updatedTask, managers);
  return responseDto;
}
  async deleteTask(userId: number, taskId: number) {
  const task = await this.taskRepository.findOne({
    where: { id: taskId },
    relations: ['step', 'step.project'],
  });

  if (!task) {
    throw new NotFoundException({
      errorCode: 'TASK_NOT_FOUND',
      message: '해당 Task를 찾을 수 없습니다.',
      data: { taskId },
    });
  }

  // 프로젝트 참여 여부 확인
  const projectId = task.step.project.id;
  const userProject = await this.userProjectRepository.findOne({
    where: {
      user: { id: userId },
      project: { id: projectId },
    },
  });

  if (!userProject) {
    throw new ForbiddenException({
      errorCode: 'NOT_PROJECT_MEMBER',
      message: '프로젝트 참여자가 아닙니다.',
    });
  }

  await this.taskRepository.delete(taskId);

  return {
    message: '업무가 성공적으로 삭제되었습니다.',
    taskId,
  };
}

} 
