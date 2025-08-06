import { ApiProperty } from '@nestjs/swagger';
import { Project } from 'src/modules/projects/entities/projects.entity';

export class ProjectResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: '나의 테스트 프로젝트' })
    name: string;

    @ApiProperty({ example: '2025-07-22T08:05:48.989Z' })
    createdAt: Date;

    @ApiProperty({ example: '2025-07-22T08:05:48.989Z' })
    updatedAt: Date;

    @ApiProperty({ example: '프로젝트 목표' })
    goal: string;

    @ApiProperty({ example: '프로젝트 규칙' })
    rule: string;

    @ApiProperty({ example: false })
    isCompleted: boolean;

    @ApiProperty({ example: null, nullable: true })
    completedAt: Date | null;

    static from(entity: Project): ProjectResponseDto {
        const dto = new ProjectResponseDto();
        dto.id = entity.id;
        dto.name = entity.name;
        dto.createdAt = entity.createdAt;
        dto.updatedAt = entity.updatedAt;
        dto.goal = entity.goal;
        dto.rule = entity.rule;
        dto.isCompleted = entity.isCompleted;
        dto.completedAt = entity.completedAt;

        return dto;
    }
}
