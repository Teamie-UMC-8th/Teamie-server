import { ApiProperty } from '@nestjs/swagger';
import { PortfolioCorrectionStatus } from 'src/common/enums/portfolio-correction-status.enum';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class PortfolioCorrectionResponseDto {
    @ApiProperty({ example: 1 })
    @IsNumber()
    id: number;

    @ApiProperty({ example: '새로운 첨삭', maxLength: 20 })
    @IsString()
    title: string;

    @ApiProperty({ example: '포트폴리오', maxLength: 20 })
    @IsString()
    submissionTarget: string;

    @ApiProperty({ example: '프론트엔드 개발자', maxLength: 15 })
    @IsString()
    jobTitle: string;

    @ApiProperty({ example: '회사 인사이트 내용', maxLength: 5000, required: false })
    @IsOptional()
    @IsString()
    companyInsight?: string;

    @ApiProperty({ example: 'JD 내용', maxLength: 500 })
    @IsString()
    jd: string;

    @ApiProperty({
        enum: PortfolioCorrectionStatus,
        example: PortfolioCorrectionStatus.NOT_STARTED,
    })
    @IsEnum(PortfolioCorrectionStatus)
    status: PortfolioCorrectionStatus;

    @ApiProperty({
        example: '2023-10-01T12:00:00Z',
    })
    @IsDate()
    @IsOptional()
    createdAt?: Date;

    @ApiProperty({
        example: '2023-10-01T12:00:00Z',
    })
    @IsDate()
    @IsOptional()
    @IsDate()
    updatedAt?: Date;

    static fromEntity(entity: any): PortfolioCorrectionResponseDto {
        const dto = new PortfolioCorrectionResponseDto();
        dto.id = entity.id;
        dto.title = entity.title;
        dto.submissionTarget = entity.submissionTarget;
        dto.jobTitle = entity.jobTitle;
        dto.companyInsight = entity.companyInsight;
        dto.jd = entity.jd;
        dto.status = entity.status;
        dto.createdAt = entity.createdAt;
        dto.updatedAt = entity.updatedAt;
        return dto;
    }
}
