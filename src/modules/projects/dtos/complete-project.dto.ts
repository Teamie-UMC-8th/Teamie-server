import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../entities/projects.entity';

export class CompleteProjectResponseDto {
  @ApiProperty({
    example: 1,
    description: '프로젝트 ID',
  })
  id: number;

  @ApiProperty({
    example: true,
    description: '프로젝트 완료 여부',
  })
  isCompleted: boolean;

  @ApiProperty({
    example: '2025-07-14T20:35:00.000Z',
    description: '프로젝트 완료 시각',
    nullable: true,
  })
  completedAt: Date | null;

  // Entity → DTO 변환 정적 메서드
  static fromEntity(entity: Project): CompleteProjectResponseDto {
    const dto = new CompleteProjectResponseDto();
    dto.id = entity.id;
    dto.isCompleted = entity.isCompleted;
    dto.completedAt = entity.completedAt;
    return dto;
  }
}