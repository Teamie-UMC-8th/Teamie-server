import { portfolioType } from 'src/common/enums/portfolio-type.enum';

export class UpdateMasterPortfolioDto {
    detailInfo?: string;
    assignedTask?: string;
    keyAchievement?: string;
    insight?: string;
    contributionRate?: number;
    category?: portfolioType;
    mainTask?: string;
}
