import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsNotEmpty, IsString } from 'class-validator';
import { projectPermission } from 'src/common/enums/project-permission.enum';
import { Type } from 'class-transformer';
export class ChangeLeaderDto {
    @ApiProperty({
        example: 1,
        description: '변경할 프로젝트 리더의 사용자 ID',
    })
    @IsNotEmpty({ message: '새로운 리더의 사용자 ID를 입력해야 합니다.' })
    @IsNumber()
    newLeaderId: number;
}
export class ChangeLeaderResponseDto {
    @ApiProperty({
        example: 1,
        description: '변경된 프로젝트 리더의 사용자 ID',
    })
    @Type(() => Number)
    @IsNotEmpty()
    @IsInt()
    newLeaderId: number;
    @ApiProperty({
        example: 'LEAD',
        description: '변경된 프로젝트 리더의 역할',
    })
    @IsString()
    permission: string = 'LEAD';

    static fromEntity(userId: number, permission: projectPermission): ChangeLeaderResponseDto {
        const responseDto = new ChangeLeaderResponseDto();
        responseDto.newLeaderId = userId;
        responseDto.permission = permission;
        return responseDto;
    }
}
