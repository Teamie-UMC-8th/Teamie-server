import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskRequestDto {
  stepId: number;
}

export class CreateTaskResponseDto {
  @ApiProperty({ example: 1, description: '생성된 업무 ID' })
  taskId: number;

  constructor(taskId: number) {
    this.taskId = taskId;
  }

  // Entity → DTO 변환 정적 메서드
  static fromEntity(entity: { id: number }): CreateTaskResponseDto {
    return new CreateTaskResponseDto(entity.id);
  }
}