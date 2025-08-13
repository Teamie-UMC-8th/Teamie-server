import { ApiProperty } from '@nestjs/swagger';
import { Status } from '../../../common/enums/status.enum';
import { UserProfile } from 'src/common/dtos/user-profile.dto';
import { TaskFileResponseDto } from '../task-files/dtos/create-task-files.dto';
import { Task } from '../entities/tasks.entity';
import { Manager } from '../entities/managers.entity';
import { TaskFile } from '../task-files/task-files.entity';

export class GetTaskResponseDto {
    @ApiProperty({
        example: 'api명세서 작성',
        description: '생성할 업무명 이름',
    })
    name: string;

    @ApiProperty({
        example: '2024-07-10 00:00:00 ',
        description: '마감기한',
    })
    deadline: string | null;

    @ApiProperty({
        example: Status.ONGOING,
        description: '진행 상황',
        enum: Status,
    })
    status: Status;

    @ApiProperty({
        example: '문서 검토가 필요합니다',
        description: '비고',
    })
    memo: string | null;

    @ApiProperty({
        type: [UserProfile],
        description: '담당자 목록',
    })
    managers: UserProfile[];

    @ApiProperty({
        type: [TaskFileResponseDto],
        description: '첨부파일 목록',
    })
    files: TaskFileResponseDto[];

    @ApiProperty({
        example: 5,
        description: '해당 업무가 속한 step의 ID',
    })
    stepId: number;

    static from(task: Task & { taskFiles: TaskFile[] }, managers: Manager[]): GetTaskResponseDto {
        const dto = new GetTaskResponseDto();
        dto.name = task.name;
        if (task.deadline) {
            dto.deadline = task.deadline?.toISOString();
        }
        dto.status = task.status;
        dto.memo = task.memo;
        dto.managers = managers.map((m) => UserProfile.from(m.user));
        dto.files = task.taskFiles.map((f) => ({
            id: f.id,
            fileUrl: f.fileUrl,
        }));
        dto.stepId = task.step.id;
        return dto;
    }
}
