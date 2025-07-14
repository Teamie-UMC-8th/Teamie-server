import { ApiProperty } from '@nestjs/swagger';
import { Status } from '../../../common/enums/status.enum';
import { IsOptional, IsNotEmpty, IsEnum, IsArray, IsNumber} from 'class-validator';
import { ManagerResponseDto } from '../../mappings/managers/dtos/create-manager-dto';
import { Type } from 'class-transformer';
import { TaskFileResponseDto} from '../../mappings/taskFiles/dtos/create-taskFile-dto';
import { Task } from '../tasks.entity';
import { Manager } from '../../mappings/managers/managers.entity';
export class UpdateTaskRequestDto {
    @ApiProperty({
    example: 'api명세서 작성',
    description: '생성할 업무명 이름',
  })
    @IsOptional()	
    name:string;
    
    @ApiProperty({
    example: '2024-07-10 00:00:00 ',
    description: '마감기한',
  })
    @IsNotEmpty()
    deadline:Date;
    
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
    memo:string;
    
    @ApiProperty({
    example: [1, 2, 3],
    description: '담당자 userId 목록',
    type: [Number],
  })
	  @IsArray()
	  @IsNumber({}, { each: true }) // 각 원소 숫자
	  @Type(() => Number)
	  managerIds: number[];
    
    @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: '첨부파일 목록 (나중에 S3 저장 예정)',
    required: false,
    })
    @IsOptional()
    files?: Express.Multer.File[];

    @ApiProperty({
    example: 5,
    description: '이동할 step의 ID',
    required: false,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    stepId?: number;
}

export class UpdateTaskResponseDto {
    @ApiProperty({
    example: 'api명세서 작성',
    description: '생성할 업무명 이름',
  })
    name:string;
    
    @ApiProperty({
    example: '2024-07-10 00:00:00 ',
    description: '마감기한',
  })
    deadline:Date;
    
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
        memo:string;
    
    @ApiProperty({
    type: [ManagerResponseDto],
    description: '담당자 목록',
    })
    managers: ManagerResponseDto[];
    
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
    dto.files = task.taskFiles.map((f) => ({
      fileUrl: f.fileUrl,
    }));
    dto.stepId = task.step.id;
    return dto;
  }
}
  