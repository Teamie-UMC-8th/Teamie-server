import { ApiProperty } from '@nestjs/swagger';
import { Status } from '../../../common/enums/status.enum';
import { IsOptional, IsNotEmpty, IsEnum, IsArray, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { Task } from '../entities/tasks.entity';
import { UserProfile } from 'src/common/dtos/user-profile.dto';
import { IsISODateString } from 'src/common/decorators/validate-iso-date.decorator';
import { Manager } from '../entities/managers.entity';
export class UpdateTaskRequestDto {
    @ApiProperty({
        example: 'api명세서 작성',
        description: '생성할 업무명 이름',
    })
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        example: '2024-07-10 00:00:00',
        description: '마감기한',
    })
    @IsOptional()
    @IsISODateString()
    @IsString()
    deadline: string;

    @ApiProperty({
        example: Status.ONGOING,
        description: '진행 상황',
        enum: Status,
    })
    @IsEnum(Status)
    status: Status;

    @ApiProperty({
        example: '문서 검토가 필요합니다',
        description: '비고',
    })
    @IsOptional()
    memo: string;

    @ApiProperty({
        example: [1, 2, 3],
        description: '담당자 userId 목록',
        type: [Number],
    })
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    @Type(() => Number)
    managerIds: number[];

    @ApiProperty({
        example: 5,
        description: '이동할 step의 ID',
    })
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    stepId: number;
}

export class UpdateTaskResponseDto {
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

    @IsNotEmpty()
    @ApiProperty({
        example: 5,
        description: '해당 업무가 속한 step의 ID',
    })
    stepId: number;

    static from(task: Task, managers: Manager[]): UpdateTaskResponseDto {
        const dto = new UpdateTaskResponseDto();
        dto.name = task.name;
        if (task.deadline) {
            dto.deadline = task.deadline?.toISOString();
        }
        dto.status = task.status;
        dto.memo = task.memo;
        dto.managers = managers.map((m) => UserProfile.from(m.user));
        dto.stepId = task.step.id;
        return dto;
    }
}
