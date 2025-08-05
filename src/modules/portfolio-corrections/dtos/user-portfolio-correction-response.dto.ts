import { ApiProperty } from '@nestjs/swagger';

export class UserPortfolioCorrectionResponseDto {
    @ApiProperty({
        example: 123,
        description: 'AI 첨삭 id',
    })
    correctionId: number;

    @ApiProperty({
        example: 'A기업1',
        description: '제목',
    })
    title: string;

    @ApiProperty({
        example: '2025-06-13T10:00:00Z',
        description: 'AI 첨삭 생성 일자',
    })
    createdAt: string;

    @ApiProperty({
        example: '브랜드 마케터',
        description: '직무명',
    })
    jobTitle: string;

    static fromEntity(entity: { id: number; title: string; createdAt: Date; jobTitle: string }) {
        const dto = new UserPortfolioCorrectionResponseDto();
        dto.correctionId = entity.id;
        dto.title = entity.title;
        dto.createdAt = entity.createdAt.toISOString();
        dto.jobTitle = entity.jobTitle;
        return dto;
    }
}
