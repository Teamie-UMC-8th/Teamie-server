import { ApiProperty } from '@nestjs/swagger';
import { portfolioType } from 'src/common/enums/portfolio-type.enum';

export class MasterPortfolioRequestDto {
    @ApiProperty({
        example: '프로젝트에 대한 상세 정보입니다.',
        description: '프로젝트에 대한 상세 정보',
    })
    detailInfo?: string;
    @ApiProperty({
        example: '프로젝트에서 담당한 업무입니다.',
        description: '프로젝트에서 담당한 업무',
    })
    assignedTask?: string;
    @ApiProperty({
        example: '프로젝트에서 달성한 주요 성과입니다.',
        description: '프로젝트에서 달성한 주요 성과',
    })
    keyAchievement?: string;
    @ApiProperty({
        example: '프로젝트에서 배운 점입니다.',
        description: '프로젝트에서 배운 점',
    })
    insight?: string;
    @ApiProperty({
        example: 50,
        description: '프로젝트에 대한 기여도 (0-100)',
    })
    contributionRate?: number;
    @ApiProperty({
        example: '자료조사, 정리',
        description: '프로젝트의 주요 업무',
    })
    mainTask?: string;
    @ApiProperty({
        example: portfolioType.OTHER,
        description: '포트폴리오 유형',
        enum: portfolioType,
    })
    category?: portfolioType;
}
