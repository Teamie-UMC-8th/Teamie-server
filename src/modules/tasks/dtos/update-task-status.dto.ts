import { ApiProperty } from '@nestjs/swagger';
import { Status } from '../../../common/enums/status.enum';
import { Task } from '../entities/tasks.entity';
import { IsNotEmpty, IsEnum } from 'class-validator';

export class UpdateTaskStatusRequestDto {
    @ApiProperty({ 
        enum: Status, 
        example: 'ONGOING',
        description: '변경할 상태' })
    @IsNotEmpty()
    status: Status;
}

export class UpdateTaskStatusResponseDto {
    @ApiProperty({
        example: 42,
        description: '수정된 업무 ID',
    })
    taskId: number;

    @ApiProperty({
        example: Status.ONGOING,
        description: '진행 상황',
        enum: Status,
    })
    status: Status;

    static from(task: Task): UpdateTaskStatusResponseDto {
        const dto = new UpdateTaskStatusResponseDto();
        dto.taskId = task.id;
        dto.status = task.status;
        return dto;
    }
}
