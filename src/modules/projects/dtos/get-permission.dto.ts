import { ApiProperty } from '@nestjs/swagger';
import { projectPermission } from 'src/common/enums/project-permission.enum';
export class PermissionResponseDto {
    @ApiProperty({ enum: projectPermission, example: projectPermission.LEAD })
    permission: projectPermission;

    static from(perm: projectPermission): PermissionResponseDto {
        const dto = new PermissionResponseDto();
        dto.permission = perm;
        return dto;
    }
}
