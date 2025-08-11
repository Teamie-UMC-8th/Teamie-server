import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class UpdateTaskStepDto {
    @ApiProperty({ example: 3, description: '새롭게 할당된 Step의 ID' })
    @IsNotEmpty()
    @IsNumber()
    newStepId: number;
}
export class UpdateTaskStepResponseDto {
    @ApiProperty({ example: 42, description: '변경된 Task의 ID' })
    taskId: number;

    @ApiProperty({ example: 3, description: '새롭게 할당된 Step의 ID' })
    newStepId: number;
    static fromEntity(taskId: number, stepId: number): UpdateTaskStepResponseDto {
        const dto = new UpdateTaskStepResponseDto();
        dto.taskId = taskId;
        dto.newStepId = stepId;
        return dto;
    }
}
