import { ApiProperty } from '@nestjs/swagger';
import { Status } from '../../../common/enums/status.enum';
import { ManagerResponseDto } from '../../mappings/managers/dtos/create-manager-dto';
import { Task } from '../tasks.entity';

export class TaskInStepDto {
    @ApiProperty({
        example: 1,
        description: '업무 ID',
    })
    taskId: number;

    @ApiProperty({
        example: '기능명세서 작성',
        description: '업무명',
    })
    taskName: string;

    @ApiProperty({
        example: 'ONGOING',
        enum: Status,
        description: '진행상황',
    })
    status: Status;

    @ApiProperty({
        type: [ManagerResponseDto],
        description: '담당자 목록',
    })
    managers: ManagerResponseDto[];

    static from(task: Task): TaskInStepDto {
        const dto = new TaskInStepDto();
        dto.taskId = task.id;
        dto.taskName = task.name;
        dto.status = task.status;
        dto.managers = (task.managers ?? []).map((m) => ({
            userId: m.user.id,
            userName: m.user.name,
        }));
        return dto;
    }
}

export class StepGroupDto {
    @ApiProperty({
        example: 10,
        description: 'stepId',
    })
    stepId: number;

    @ApiProperty({
        example: 'step1',
        description: '스텝 명',
    })
    stepName: string;

    @ApiProperty({
        type: [TaskInStepDto],
        description: '해당 단계에 포함된 업무 목록',
    })
    tasks: TaskInStepDto[];
}

export class TaskDashboardStepViewDto {
    @ApiProperty({
        example: 1,
        description: '프로젝트 Id',
    })
    projectId: number;

    @ApiProperty({
        example: '프로젝트 A',
        description: '프로젝트명',
    })
    projectName: string;

    @ApiProperty({
        type: [StepGroupDto],
        description: '단계별로 묶인 업무 정보',
    })
    steps: StepGroupDto[];
}
