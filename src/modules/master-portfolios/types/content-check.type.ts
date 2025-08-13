import { MasterPortfolioOutput } from 'src/common/types/master-portfolio.type';

export type MasterPortfolioContentCheckResult = {
    [K in keyof MasterPortfolioOutput]?: boolean;
};
