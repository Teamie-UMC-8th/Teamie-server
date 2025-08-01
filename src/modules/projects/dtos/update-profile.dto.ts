import { ApiProperty } from '@nestjs/swagger';
import { UserInProjectDto } from './all-project-response.dto';

export class UpdateProfileDto {
    @ApiProperty({ example: '프로필 유저 아이디' })
    id: number;
    @ApiProperty({ example: '역할' })
    role: string;
}

export class UpdateProfileResponseDto {
    users: UserInProjectDto[];
    static fromEntity(users: UserInProjectDto[]): UpdateProfileResponseDto {
        const dto = new UpdateProfileResponseDto();
        dto.users = users;
        return dto;
    }
}
