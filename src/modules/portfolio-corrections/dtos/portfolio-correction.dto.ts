import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePortfolioCorrectionDto {
    @ApiProperty({ description: '포트폴리오 첨삭 제목', example: '수정된 제목 A' })
    @IsOptional()
    @IsString()
    title?: string;
}
