import { ApiProperty } from '@nestjs/swagger';
import { projectPermission } from 'src/common/enums/project-permission.enum';

export class ValidateInviteResponseDto {
    @ApiProperty({
        example: 1,
        description: '프로젝트 아이디',
    })
    projectId: number;

    @ApiProperty({
        example: '프로젝트명',
        description: '프로젝트 이름',
    })
    name: string;

    @ApiProperty({
        example: projectPermission.MEMBER,
        enum: projectPermission,
        description: '사용자 권한',
    })
    permission: projectPermission;

    @ApiProperty({
        example: '김수빈',
        description: '프로젝트 리더 이름',
    })
    leaderName: string;

    // Entity → DTO 변환 정적 메서드
    static fromEntity(
        projectId: number,
        projectName: string,
        permission: projectPermission,
        leaderName: string
    ): ValidateInviteResponseDto {
        const dto = new ValidateInviteResponseDto();
        dto.projectId = projectId;
        dto.name = projectName;
        dto.permission = permission;
        dto.leaderName = leaderName;
        return dto;
    }
}
