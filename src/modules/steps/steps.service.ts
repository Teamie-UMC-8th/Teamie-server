import { Injectable, Inject  } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Step } from './entities/steps.entity';
import { Project } from '../projects/entities/projects.entity';
import { Repository } from 'typeorm';
import { CreateStepDto} from './dtos/create-step.dto';
import { StepWithTaskDto } from './dtos/step-with-task.dto';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { CommonResponse } from '../../common/response/common-response.dto';
import { ProjectNotFoundException } from 'src/common/exceptions/custom.errors';
@Injectable()
export class StepsService {
    constructor(
        @InjectRepository(Step)
        private readonly stepRepository: Repository<Step>,
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
        @Inject('REDIS_CLIENT')
        private readonly redis: Cache,
        private readonly configService: ConfigService
    ) {}

    async createStep(dto: CreateStepDto, proejectId:Number, userId: number): Promise<CommonResponse<StepWithTaskDto>> {
        const { name, projectId } = dto;

        const project = await this.projectRepository.findOne({ where: { id: projectId } });
        if (!project) {
            throw new ProjectNotFoundException();
        }

        const step = this.stepRepository.create({
            name,
            project,
        });

        const savedStep = await this.stepRepository.save(step);

        return CommonResponse.success(StepWithTaskDto.fromEntity(savedStep));
    }
}