import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PromptLoader } from 'src/common/utils/prompt.loader';
import { LLMService } from 'src/infra/llm/llm.service';
import { correctionSchema, Correction } from 'src/infra/llm/schemas/portfolio-correction.schema';
import z from 'zod';
import { PortfolioCorrection } from './entities/portfolio-correction.entity';
import { QueryRunner, Repository } from 'typeorm';
import { AICorrection } from './entities/ai-correction.entity';
import { PaginatedResponseDto } from 'src/common/response/paginated-response.dto';
import { UserPortfolioCorrectionResponseDto } from './dtos/user-portfolio-correction-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AIGenerationAlreadyExists } from 'src/common/exceptions/custom.errors';

@Injectable()
export class PortfolioCorrectionsService {
    constructor(
        private readonly llmService: LLMService,
        private readonly promptLoader: PromptLoader,
        @InjectRepository(PortfolioCorrection)
        private readonly correctionRepository: Repository<PortfolioCorrection>,
        @InjectRepository(AICorrection)
        private readonly aiCorrectionRepository: Repository<AICorrection>
    ) {}
    async getFinalPortfoliosByUser(userId: number, cursorDate: Date, pageSize: number) {
        const portfolios = await this.correctionRepository
            .createQueryBuilder('fp')
            .where('fp.userId = :userId', { userId })
            .andWhere('fp.createdAt < :cursorDate', { cursorDate })
            .orderBy('fp.createdAt', 'DESC')
            .take(pageSize + 1)
            .getMany();

        const hasNextPage: boolean = portfolios.length > pageSize;
        const nextCursor: string | null =
            portfolios.length > 0 && hasNextPage
                ? portfolios[portfolios.length - 2].createdAt.toISOString()
                : null;
        const result = portfolios
            .slice(0, pageSize)
            .map((entity) => UserPortfolioCorrectionResponseDto.fromEntity(entity));
        return PaginatedResponseDto.of(result, nextCursor, hasNextPage);
    }

    async generateCorrection(qr: QueryRunner, userId: number, correctionId: number, selectedProjects: number[]) {
        const dummyData = await this.promptLoader.load('dummy-correction.json');

        // correctionId에 해당하는 포트폴리오 첨삭 엔티티가 있는지
        const existCorrectionPortfolio = await qr.manager.findOne(PortfolioCorrection, {
            where: { id: correctionId, user: { id: userId } },
        })
        if (!existCorrectionPortfolio) {
            throw new NotFoundException(`포트폴리오 첨삭이 존재하지 않습니다. ID: ${correctionId}`);
        }

        try {
            const correctionPromises = selectedProjects.map(async (projectId) => {
                // 각 프로젝트마다 portfolioData가 존재
                // TODO: 실제 데이터로 교체 필요 (프로젝트명도 가져오기)
                const portfolioData = await this.promptLoader.load('masterportfolio.json');
                const projectName = `임시 프로젝트명 ${projectId}`;

                // 기존 첨삭 결과가 존재하는지 확인
                const existingAICorrection = await qr.manager.findOne(AICorrection, {
                    where: { projectId, portfolioCorrection: { id: correctionId } },
                });
                if (existingAICorrection) {
                    throw new AIGenerationAlreadyExists(`project ID: ${projectId}`);
                }

                // LLM을 통해 첨삭 생성
                const correctionResult = await this.llmService.generateCorrection(
                    dummyData,
                    portfolioData
                );

                // zod 스키마로 검증
                let correction: Correction;
                try {
                    correction = correctionSchema.parse(correctionResult);
                } catch (error) {
                    console.error(`zod 스키마 검증 실패. 프로젝트 ${projectId}:`, error.errors);
                    throw new Error(`zod 검증 실패. 프로젝트 ${projectId}`);
                }

                // DB에 저장
                await qr.manager.save(AICorrection, {
                    projectId,
                    portfolioCorrection: existCorrectionPortfolio,
                    modelName: process.env.LLM_CORRECTION_MODEL_NAME || 'google/gemini-2.5-flash-lite-preview-06-17',
                    llmTemperature: 0.3,
                    correctionResult: correction,
                })

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

            return mergedCorrection;
        } catch (error) {
            if (error instanceof AIGenerationAlreadyExists) {
                throw error;
            }

            console.error('첨삭 과정 중 실패: ', error);
            throw new Error('첨삭 과정 중 실패');
        }
    }

    async getCorrection() {}
}
