import { portfolioType } from 'src/common/enums/portfolio-type.enum';
import { MasterPortfolio } from '../entities/master-portfolios.entity';
import { ApiProperty } from '@nestjs/swagger';

export class MasterPortfolioResponseDto {
    @ApiProperty({
        description: '마스터 포트폴리오 ID',
        example: 1,
    })
    id: number;
    @ApiProperty({
        description: '프로젝트에 대한 상세 정보',
        example: '프로젝트에 대한 상세 정보입니다.',
    })
    detailInfo: string;
    @ApiProperty({
        description: '프로젝트에서 담당한 업무',
        example: '프로젝트에서 담당한 업무입니다.',
    })
    assignedTask: string;
    @ApiProperty({
        description: '프로젝트에서 달성한 주요 성과',
        example: '프로젝트에서 달성한 주요 성과입니다.',
    })
    keyAchievement: string;
    @ApiProperty({
        description: '프로젝트에서 배운 점',
        example: '프로젝트에서 배운 점입니다.',
    })
    insight: string;
    @ApiProperty({
        description: '프로젝트에 대한 기여도 (0-100)',
        example: 50,
    })
    contributionRate: number;
    @ApiProperty({
        description: '프로젝트의 주요 업무',
        example: '자료조사, 정리',
    })
    mainTask: string;
    @ApiProperty({
        description: '포트폴리오 유형',
        example: portfolioType.OTHER,
        enum: portfolioType,
    })
    category: portfolioType;

    static from(data: MasterPortfolio): MasterPortfolioResponseDto {
        const dto = new MasterPortfolioResponseDto();
        dto.id = data.id;
        dto.detailInfo = data.detailInfo;
        dto.assignedTask = data.assignedTask;
        dto.keyAchievement = data.keyAchievement;
        dto.insight = data.insight;
        dto.contributionRate = data.contributionRate;
        dto.mainTask = data.mainTask;
        dto.category = data.category;

        return dto;
    }
}
