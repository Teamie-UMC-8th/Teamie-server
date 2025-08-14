import { ApiProperty } from '@nestjs/swagger';
import { UserInProjectDto } from './all-project-response.dto';
import { IsInt, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProfileDto {
    @ApiProperty({ example: 123 })
    @Type(() => Number) // "123" -> 123 로 변환 (transform: true일 때)
    @IsInt()
    id: number;

    @ApiProperty({ example: '기획' })
    @IsString()
    @IsNotEmpty()
    // 필요하면 enum으로 제한: @IsEnum(projectRole)
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
