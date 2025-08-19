export interface MasterPortfolioOutput {
    detailInfo: string;
    assignedTask: string;
    keyAchievement: string;
    insight: string;
}

export interface InputPortfolio {
    projectName?: string;
    detailInfo: string;
    assignedTask: string;
    keyAchievement: string;
    insight: string;
}
export interface OutputPortfolio {
    detailInfo: OutputItem[];
    assignedTask: OutputItem[];
    keyAchievement: OutputItem[];
    insight: OutputItem[];
}

export interface OutputItem {
    type: 'line' | 'header';
    number?: number;
    text: string;
}
