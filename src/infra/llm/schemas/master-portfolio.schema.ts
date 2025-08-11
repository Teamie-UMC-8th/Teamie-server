import { z } from 'zod';

export const masterPortfolioSchema = z.object({
    detailInfo: z.string().describe('프로젝트의 상세 정보'),
    assignedTask: z.string().describe('프로젝트에서 담당한 업무'),
    keyAchievement: z.string().describe('프로젝트의 주요 성과'),
    insight: z.string().describe('프로젝트를 통해 배운 점'),
});

export type MasterPortfolio = z.infer<typeof masterPortfolioSchema>;
