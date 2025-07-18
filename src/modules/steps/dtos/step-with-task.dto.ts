import { ApiProperty } from '@nestjs/swagger';
import { Step } from '../entities/steps.entity';
import { TaskDto } from '../../tasks/dtos/task.dto';
export class StepWithTaskDto {
    @ApiProperty({ example: 1, description: "생성된 Step ID" })
    stepId: number;

    @ApiProperty({ example: "기획 단계", description: "생성된 Step의 이름" })
    name: string;

    @ApiProperty({ type: [TaskDto], description: "Step에 포함된 Task들" })
    tasks: TaskDto[];

    // Entity → DTO 변환 정적 메서드
    static fromEntity(entity: Step): StepWithTaskDto {
        const dto = new StepWithTaskDto();
        dto.name = entity.name;
        return dto;
    }
}