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
import { Project } from '../projects/entities/projects.entity';
import { CreatePortfolioCorrectionDto } from './dtos/create-corrections.dto';

@Injectable()
export class PortfolioCorrectionsService {
    constructor(
        private readonly llmService: LLMService,
        private readonly promptLoader: PromptLoader,
        @InjectRepository(PortfolioCorrection)
        private readonly correctionRepository: Repository<PortfolioCorrection>,
        @InjectRepository(AICorrection)
        private readonly aiCorrectionRepository: Repository<AICorrection>,
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>
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

    // TODO: selectedProjects에 해당하는 id들 DB에 저장하기
    async generateCorrection(
        qr: QueryRunner,
        userId: number,
        correctionId: number,
        selectedProjects: number[]
    ) {
        const dummyData = await this.promptLoader.load('dummy-correction.json');

        // 프로젝트 최대 선택 개수 6개로 제한
        if (selectedProjects.length > 6) {
            // TODO: 커스텀 에러 생성 필요
            throw new InternalServerErrorException('프로젝트는 최대 6개까지 선택할 수 있습니다.');
        }

        // correctionId에 해당하는 포트폴리오 첨삭 엔티티가 있는지
        const existCorrectionPortfolio = await qr.manager.findOne(PortfolioCorrection, {
            where: { id: correctionId, user: { id: userId } },
        });
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
                    modelName:
                        process.env.LLM_CORRECTION_MODEL_NAME ||
                        'google/gemini-2.5-flash-lite-preview-06-17',
                    llmTemperature: 0.3,
                    correctionResult: correction,
                });

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

    // TODO: correctionId로 해당하는 프로젝트 id들과 첫 결과만 가져오고, 다른 프로젝트들을 각각 projectId로 로드하는 API를 따로 만들까 생각 중
    // 생성된 AI 첨삭 결과 조회
    async getCorrection(correctionId: number) {
        // correctionId에 해당하는 포트폴리오 첨삭 엔티티가 있는지
        const existCorrectionPortfolio = await this.correctionRepository.findOne({
            where: { id: correctionId },
        });
        if (!existCorrectionPortfolio) {
            throw new NotFoundException(`포트폴리오 첨삭이 존재하지 않습니다. ID: ${correctionId}`);
        }
        // correctionId에 해당하는 AI 첨삭 엔티티가 있는지
        const existAICorrection = await this.aiCorrectionRepository.findOne({
            where: { portfolioCorrection: { id: correctionId } },
        });
        if (!existAICorrection) {
            throw new NotFoundException(`AI 첨삭 결과가 존재하지 않습니다. ID: ${correctionId}`);
        }

        const result = await this.aiCorrectionRepository.find({
            where: { portfolioCorrection: { id: correctionId } },
        });
        return result;
    }

    async getSelectableProjects(userId: number) {
        // userId로 project들 조회
        const projects = await this.projectRepository
            .createQueryBuilder('project')
            .innerJoin('project.userProjects', 'userProject')
            .innerJoin('userProject.user', 'user')
            .where('user.id = :userId', { userId })
            .getMany();

        return projects;
    }

    async createPortfolioCorrection(
        userId: number,
        createPortfolioCorrectionDto: CreatePortfolioCorrectionDto
    ) {
        const newCorrection = this.correctionRepository.create({
            title: createPortfolioCorrectionDto.title || '새로운 첨삭 A',
            submissionTarget: createPortfolioCorrectionDto.submissionTarget,
            jobTitle: createPortfolioCorrectionDto.jobTitle,
            jd: createPortfolioCorrectionDto.jd,
            user: { id: userId },
        });
        return await this.correctionRepository.save(newCorrection);
    }
}
