import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Step } from '../entities/steps.entity';
import { CreateTaskResponseDto } from '../../tasks/dtos/create-task.dto';

export class CreateStepDto {
    @ApiProperty({
        example: '기획 단계',
        description: '생성할 Step의 이름',
    })
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        example: 1,
        description: '프로젝트 ID',
    })
    @IsNotEmpty()
    projectId: number;
}

export class CreateStepResponseDto {
    @ApiProperty({ example: 1, description: '생성된 Step ID' })
    stepId: number;

    @ApiProperty({ example: '기획 단계', description: '생성된 Step의 이름' })
    name: string;

    static fromEntity(entity: Step): CreateStepResponseDto {
        const dto = new CreateStepResponseDto();
        dto.stepId = entity.id;
        dto.name = entity.name;
        return dto;
    }
}
