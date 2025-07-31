import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../entities/projects.entity';
export class JoinProjectDto {
    @ApiProperty()
    projectId: number;
}
export class JoinProjectResponseDto {
    @ApiProperty({ description: '요청 처리 결과 메시지' })
    message: string;

    @ApiProperty({ description: '참여된 프로젝트 ID', example: 123 })
    projectId: number;

    @ApiProperty({ description: '참여된 프로젝트 이름', example: 'My Awesome Project' })
    projectName: string;

    @ApiProperty({ description: '참여한 사용자 이름', example: 'alice' })
    username: string;
    static fromEntity(message: string, project: Project): JoinProjectResponseDto {
        const dto = new JoinProjectResponseDto();
        dto.message = message;
        dto.projectId = project.id;
        dto.projectName = project.name;
        return dto;
    }
}
