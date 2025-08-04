import { Injectable } from '@nestjs/common';
import { PromptLoader } from 'src/common/utils/prompt.loader';
import { LLMService } from 'src/infra/llm/llm.service';
import { correctionSchema, Correction } from 'src/infra/llm/schemas/portfolio-correction.schema';
import z from 'zod';

@Injectable()
export class PortfolioCorrectionsService {
    constructor(
        private readonly llmService: LLMService,
        private readonly promptLoader: PromptLoader
    ) {}

    async generateCorrection(userId: number, selectedProjects: number[]) {
        const dummyData = await this.promptLoader.load('dummy-correction.json');

        try {
            const correctionPromises = selectedProjects.map(async (projectId) => {
                // 각 프로젝트마다 portfolioData가 존재
                // TODO: 실제 데이터로 교체 필요 (프로젝트명도 가져오기)
                const portfolioData = await this.promptLoader.load('masterportfolio.json');
                const projectName = `임시 프로젝트명 ${projectId}`;
                const correctionResult = await this.llmService.generateCorrection(
                    dummyData,
                    portfolioData
                );

                let correction: Correction;
                try {
                    correction = correctionSchema.parse(correctionResult);
                } catch (error) {
                    console.error(`Validation error for project ${projectId}:`, error.errors);
                    throw new Error(`Validation failed for project ${projectId}`);
                }

                return {
                    projectId,
                    projectName,
                    correction,
                };
            });

            // 모든 첨삭 작업 대기
            const correctionResults = await Promise.all(correctionPromises);
            // 결과 합치기
            const mergedCorrection = [...correctionResults];
            console.log('모든 프로젝트에 대한 첨삭 결과:', mergedCorrection);
            console.log(mergedCorrection.length);

            return mergedCorrection;
        } catch (error) {
            console.error('첨삭 과정 중 실패: ', error);
            throw new Error('첨삭 과정 중 실패');
        }
    }

    async getCorrection() {}
}
