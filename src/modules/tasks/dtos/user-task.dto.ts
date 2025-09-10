import { ApiProperty } from '@nestjs/swagger';
import { UserProfile } from 'src/common/dtos/user-profile.dto';
import { Status } from 'src/common/enums/status.enum';
import { Manager } from 'src/modules/tasks/entities/managers.entity';

export class TaskCardDTO {
    @ApiProperty({
        example: 123,
        description: '업무 식별자',
    })
    id: number;

    @ApiProperty({
        example: '1차 과제 제출용 와이어프레임',
        description: '업무명',
    })
    name: string;

    @ApiProperty({
        example: Status.ONGOING,
        description: '업무의 진행상태',
    })
    status: Status;

    @ApiProperty({
        example: '2025-08-15T10:00:00Z',
        description: '업무의 마감기한',
    })
    deadline?: string;

    @ApiProperty({
        example: '2025-08-13T10:00:00Z',
        description: '업무의 생성일',
    })
    createdAt: string;

    @ApiProperty({
        description: '업무의 담당자 리스트',
        isArray: true,
        type: UserProfile,
    })
    managers: UserProfile[];

    static from(entity: {
        id: number;
        name: string;
        status: Status;
        deadline: Date | null;
        createdAt: Date;
        managers: Manager[];
    }) {
        const dto = new TaskCardDTO();
        dto.id = entity.id;
        dto.name = entity.name;
        dto.status = entity.status;
        if (entity.deadline) dto.deadline = entity.deadline.toISOString();
        dto.createdAt = entity.createdAt.toISOString();
        dto.managers = entity.managers.map((manager) => UserProfile.from(manager.user));
        return dto;
    }
}

export class ProjectDashBoardDTO {
    @ApiProperty({
        example: 123,
        description: '프로젝트 식별자',
    })
    projectId: number;

    @ApiProperty({
        example: '프로젝트A',
        description: '프로젝트 이름',
    })
    projectName: string;

    @ApiProperty({
        description: '프로젝트 별 나에게 배정된 업무 리스트',
        isArray: true,
        type: TaskCardDTO,
    })
    tasks: TaskCardDTO[];

    @ApiProperty({
        example:
            'eyJkZWFkbGluZSI6IjIwMjUtMDktMjhUMTQ6NTk6NTkuMDAwWiIsImNyZWF0ZWRBdCI6IjIwMjUtMDgtMjFUMTk6NTA6MzEuODcyWiJ9",',
        description: '나의 업무 조회/더보기에 필요한 커서',
    })
    taskCursor: string | null;

    static from(entity: { id: number; name: string; tasks: TaskCardDTO[]; cursor: string | null }) {
        const dto = new ProjectDashBoardDTO();
        dto.projectId = entity.id;
        dto.projectName = entity.name;
        dto.tasks = entity.tasks;
        dto.taskCursor = entity.cursor;
        return dto;
    }
}
