import { Project } from 'src/modules/projects/entities/projects.entity';
import { ApiProperty } from '@nestjs/swagger';
import { projectPermission } from 'src/common/enums/project-permission.enum';
export class UserProjectResponseDto {
    @ApiProperty({
        example: 1,
        description: '프로젝트 id',
    })
    id: number;
    @ApiProperty({
        example: '내 프로젝트',
        description: '프로젝트 이름',
    })
    name: string;
    @ApiProperty({
        example: projectPermission.MEMBER,
        description: '프로젝트 내 권한',
    })
    permission: string;

    static fromEntity(entity: {
        project: Project;
        permission: projectPermission;
    }): UserProjectResponseDto {
        const dto = new UserProjectResponseDto();
        dto.id = entity.project.id;
        dto.name = entity.project.name;
        dto.permission = entity.permission;
        return dto;
    }
}
