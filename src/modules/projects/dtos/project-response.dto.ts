import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../entities/projects.entity';
import { UserWithTasksDto } from '../../mappings/user-projects/dtos/user-with-task.dto';

export class ProjectResponseDto {
    @ApiProperty({
        example: 544844,
        description: '프로젝트 ID',
    })
    id: number;

    @ApiProperty({
        example: '프로젝트명',
        description: '프로젝트 이름',
    })
    name: string;

    @ApiProperty({
        example: '팀 목표를 여기에 작성',
        description: '프로젝트 목표',
        nullable: true,
    })
    goal: string | null;

    @ApiProperty({
        example: '우리 팀의 규칙을 여기에 작성',
        description: '프로젝트 규칙',
        nullable: true,
    })
    rule: string | null;

    @ApiProperty({ type: [UserWithTasksDto] })
    users: UserWithTasksDto[];

    // 정적 메서드: entity → dto 매핑
    static fromEntity(project: Project): ProjectResponseDto {
        const dto = new ProjectResponseDto();
        dto.id = project.id;
        dto.name = project.name;
        dto.goal = project.goal;
        dto.rule = project.rule;
        dto.users = project.userProjects.map((up) => UserWithTasksDto.fromEntity(up));
        return dto;
    }
}
