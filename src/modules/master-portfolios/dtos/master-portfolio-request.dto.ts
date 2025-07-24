import { portfolioType } from 'src/common/enums/portfolio-type.enum';

export class MasterPortfolioRequestDto {
    detailInfo?: string;
    assignedTask?: string;
    keyAchievement?: string;
    insight?: string;
    contributionRate?: number;
    mainTask?: string;
    category?: portfolioType;
}
