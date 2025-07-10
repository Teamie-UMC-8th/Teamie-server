import {BadRequestException, ForbiddenException, Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial} from 'typeorm';
import { Task } from './tasks.entity';
import { Step } from '../steps/steps.entity';
import { UserProject } from '../mappings/userProjects/userProjects.entity'; 
import { CreateTaskRequestDto, CreateTaskResponseDto  } from './dtos/create-task.dto';
import { CommonResponse} from '../../common/response/common-response.dto'

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    @InjectRepository(Step)
    private readonly stepRepository: Repository<Step>,

    @InjectRepository(UserProject)
    private readonly userProjectRepository: Repository<UserProject>,
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
}