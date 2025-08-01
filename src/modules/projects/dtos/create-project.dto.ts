import { IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../entities/projects.entity';
export class CreateProjectDto {
    @ApiProperty({
        example: '우리 팀 프로젝트',
        description: '생성할 프로젝트 이름',
    })
    @IsNotEmpty()
    name: string;
}

export class CreateProjectResponseDto {
    @ApiProperty({
        example: 1,
        description: '프로젝트 ID',
    })
    id: number;

    @ApiProperty({
        example: '우리 팀 프로젝트',
        description: '프로젝트 이름',
    })
    name: string;

    @ApiProperty({
        example: 'abcd1234',
        description: '초대 코드 URL',
    })
    inviteCode: string;

    @ApiProperty({
        example: '2025-07-21T20:35:00.000Z',
        description: 'url 만료 시간',
    })
    @IsDateString()
    expiresAt: string;

    //  Entity → DTO 변환 정적 메서드
    static fromEntity(
        entity: Project,
        inviteCode: string,
        expiresAt: string
    ): CreateProjectResponseDto {
        const dto = new CreateProjectResponseDto();
        dto.id = entity.id;
        dto.name = entity.name;
        dto.inviteCode = inviteCode;
        dto.expiresAt = expiresAt;
        return dto;
    }
}
