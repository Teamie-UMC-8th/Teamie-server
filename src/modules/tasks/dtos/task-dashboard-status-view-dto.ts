import { ApiProperty } from '@nestjs/swagger';
import { Status } from '../../../common/enums/status.enum';
import { ManagerResponseDto } from './create-manager-dto';
import { Task } from '../entities/tasks.entity';

export class TaskInStatusDto {
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
        example: 10,
        description: '해당 업무가 속한 단계 ID',
    })
    stepId: number;

    @ApiProperty({
        example: '기획',
        description: '해당 업무가 속한 단계 이름',
    })
    stepName: string;

    @ApiProperty({
        type: [ManagerResponseDto],
        description: '담당자 목록',
    })
    managers: ManagerResponseDto[];

    @ApiProperty({
        example: '2025-08-31T15:00:00.000Z',
        description: '업무 마감일',
        nullable: true,
    })
    deadline: Date | null;

    static from(task: Task): TaskInStatusDto {
        const dto = new TaskInStatusDto();
        dto.taskId = task.id;
        dto.taskName = task.name;
        dto.stepId = task.step.id;
        dto.stepName = task.step.name;
        dto.deadline = task.deadline;
        dto.managers = (task.managers ?? []).map((m) => ({
            userId: m.user.id,
            userName: m.user.name,
        }));
        return dto;
    }
}

export class StatusGroupDto {
    @ApiProperty({
        example: 'ONGOING',
        enum: Status,
        description: '진행 상황',
    })
    status: Status;

    @ApiProperty({
        type: [TaskInStatusDto],
        description: '해당 상태에 속한 업무 목록',
    })
    tasks: TaskInStatusDto[];
}

export class TaskDashboardStatusViewDto {
    @ApiProperty({
        example: 1,
        description: '프로젝트 ID',
    })
    projectId: number;

    @ApiProperty({
        example: '프로젝트A',
        description: '프로젝트 이름',
    })
    projectName: string;

    @ApiProperty({
        type: [StatusGroupDto],
        description: '진행 상황별로 묶인 업무 정보',
    })
    statusGroups: StatusGroupDto[];

    @ApiProperty({
        example: 62,
        description: '해당 프로젝트의 전체 업무 개수',
    })
    totalCount: number;
}
