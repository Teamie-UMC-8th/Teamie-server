import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { portfolioType } from 'src/common/enums/portfolio-type.enum';

export class MasterPortfolioRequestDto {
    @ApiProperty({
        example: '프로젝트에 대한 상세 정보입니다.',
        description: '프로젝트에 대한 상세 정보',
    })
    @IsOptional()
    @IsString()
    detailInfo?: string;

    @ApiProperty({
        example: '프로젝트에서 담당한 업무입니다.',
        description: '프로젝트에서 담당한 업무',
    })
    @IsOptional()
    @IsString()
    assignedTask?: string;

    @ApiProperty({
        example: '프로젝트에서 달성한 주요 성과입니다.',
        description: '프로젝트에서 달성한 주요 성과',
    })
    @IsOptional()
    @IsString()
    keyAchievement?: string;

    @ApiProperty({
        example: '프로젝트에서 배운 점입니다.',
        description: '프로젝트에서 배운 점',
    })
    @IsOptional()
    @IsString()
    insight?: string;

    @ApiProperty({
        example: 50,
        description: '프로젝트에 대한 기여도 (0-100)',
    })
    @IsOptional()
    @IsNumber()
    contributionRate?: number;

    @ApiProperty({
        example: '자료조사, 정리',
        description: '프로젝트의 주요 업무',
    })
    @IsOptional()
    @IsString()
    mainTask?: string;

    @ApiProperty({
        example: portfolioType.OTHER,
        description: '포트폴리오 유형',
        enum: portfolioType,
    })
    @IsOptional()
    @IsEnum(portfolioType)
    category?: portfolioType;
}
