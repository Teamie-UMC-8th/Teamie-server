import { ApiProperty } from '@nestjs/swagger';

export class ValidateInviteResponseDto {
    @ApiProperty({
        example: 1,
        description: '프로젝트 아이디',
    })
    projectId: number;

    // Entity → DTO 변환 정적 메서드
    static fromEntity(entity: any): ValidateInviteResponseDto {
        const dto = new ValidateInviteResponseDto();
        dto.projectId = entity.pojectId;
        return dto;
    }
}
