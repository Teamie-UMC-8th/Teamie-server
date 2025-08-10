import { ApiProperty } from '@nestjs/swagger';
import { UserInProjectDto } from './all-project-response.dto';
import { IsInt, IsString, IsNotEmpty, IsPositive} from 'class-validator';
import { Type } from 'class-transformer';
export class UpdateProfileDto {
    @ApiProperty({ example: 123, description: '프로필 유저 아이디' })
  @Type(() => Number)   // "123" -> 123 (transform: true일 때)
  @IsInt()
  @IsPositive()
  id: number;

  @ApiProperty({ example: 'LEAD', description: '역할' })
  @IsString()
  @IsNotEmpty()
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
