import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, IsInt, Min, Max, IsDate, IsDateString } from 'class-validator';
export class CreatePostDto {
    @ApiProperty({
        example: '이것은 포스트잇 내용입니다.',
        description: '포스트잇 내용',
        maxLength: 32,
        minLength: 1,
    })
    @IsString()
    @MaxLength(32)
    content: string;
}

export class CreatePostResponseDto {
    @ApiProperty({
        example: 1,
        description: '포스트잇 ID',
    })
    @IsInt()
    id: number;

    @ApiProperty({
        example: 1,
        description: '사용자 ID',
    })
    @IsInt()
    userId: number;

    @ApiProperty({
        example: '이것은 포스트잇 내용입니다.',
        description: '포스트잇 내용',
    })
    @IsString()
    content: string;

    @ApiProperty({
        example: 1,
        description: '프로젝트 ID',
    })
    @IsInt()
    projectId: number;

    @ApiProperty({
        example: '2025-07-14T20:35:00.000Z',
        description: '포스트잇 생성 시각',
    })
    @IsDateString()
    createdAt: string;

    static fromEntity(entity: RedisPost, projectId: number): CreatePostResponseDto {
        const dto = new CreatePostResponseDto();
        dto.id = entity.id;
        dto.content = entity.content;
        dto.projectId = projectId;
        dto.userId = entity.userId;
        dto.createdAt = entity.createdAt;
        return dto;
    }
}
