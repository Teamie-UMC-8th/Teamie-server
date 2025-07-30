import { ApiProperty } from '@nestjs/swagger';
import { Status } from '../../../common/enums/status.enum';
import { IsOptional, IsNotEmpty, IsEnum, IsArray, IsNumber } from 'class-validator';
import { ManagerResponseDto } from '../../mappings/managers/dtos/create-manager-dto';
import { Type } from 'class-transformer';
import { Task } from '../tasks.entity';
import { Manager } from '../../mappings/managers/managers.entity';
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
    @IsNotEmpty()
    deadline: Date | null;

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
    @IsNotEmpty()
    memo: string | null;

    @ApiProperty({
        example: [1, 2, 3],
        description: '담당자 userId 목록',
        type: [Number],
    })
    @IsArray()
    @IsNumber({}, { each: true })
    @Type(() => Number)
    managerIds: number[];

    @IsOptional()
    @ApiProperty({
        type: [String],
        description: '기존 파일 URL 목록 (수정 시 유지할 기존 파일들)',
    })
    existingFileUrls?: string[];

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
    deadline: Date | null;

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
        type: [ManagerResponseDto],
        description: '담당자 목록',
    })
    managers: ManagerResponseDto[];

    @IsNotEmpty()
    @ApiProperty({
        example: 5,
        description: '해당 업무가 속한 step의 ID',
    })
    stepId: number;

    static from(task: Task, managers: Manager[]): UpdateTaskResponseDto {
        const dto = new UpdateTaskResponseDto();
        dto.name = task.name;
        dto.deadline = task.deadline;
        dto.status = task.status;
        dto.memo = task.memo;
        dto.managers = managers.map((m) => ({
            userId: m.user.id,
            userName: m.user.name,
        }));
        dto.stepId = task.step.id;
        return dto;
    }
}
