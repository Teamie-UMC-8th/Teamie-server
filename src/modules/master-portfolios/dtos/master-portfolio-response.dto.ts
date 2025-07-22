import { portfolioType } from 'src/common/enums/portfolio-type.enum';
import { MasterPortfolio } from '../entities/master-portfolios.entity';

export class MasterPortfolioResponseDto {
    id: number;
    detailInfo: string;
    assignedTask: string;
    keyAchievement: string;
    insight: string;
    contributionRate: number;
    mainTask: string;
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
