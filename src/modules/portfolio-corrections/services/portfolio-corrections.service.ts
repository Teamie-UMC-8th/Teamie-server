import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PromptLoader } from 'src/common/utils/prompt.loader';
import { LLMService } from 'src/infra/llm/llm.service';
import { correctionSchema, Correction } from 'src/infra/llm/schemas/portfolio-correction.schema';
import { PortfolioCorrection } from '../entities/portfolio-correction.entity';
import { QueryRunner, Repository } from 'typeorm';
import { AICorrection } from '../entities/ai-correction.entity';
import { PaginatedResponseDto } from 'src/common/response/paginated-response.dto';
import { UserPortfolioCorrectionResponseDto } from '../dtos/user-portfolio-correction-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
    AIGenerationAlreadyExists,
    ProjectNotFoundException,
} from 'src/common/exceptions/custom.errors';
import { Project } from '../../projects/entities/projects.entity';
import { CreatePortfolioCorrectionDto } from '../dtos/create-corrections.dto';
import { RAGData } from '../entities/rag-data.entity';
import { RAGDataType } from 'src/common/enums/rag-data-type.enum';
import { ProjectResponseDto } from '../dtos/project-response.dto';
import { PortfolioCorrectionStatus } from 'src/common/enums/portfolio-correction-status.enum';
import { MasterPortfolioAI } from '../../master-portfolios/entities/master-portfolio-ai.entity';
import { RagService } from 'src/infra/llm/rag.service';

async function checkCorrectionExists(qr: QueryRunner, correctionId: number) {
    // correctionId에 해당하는 포트폴리오 첨삭 엔티티가 있는지
    const existCorrectionPortfolio = await qr.manager.findOne(PortfolioCorrection, {
        where: { id: correctionId },
    });
    if (!existCorrectionPortfolio) {
        throw new NotFoundException(`포트폴리오 첨삭이 존재하지 않습니다. ID: ${correctionId}`);
    }
}

@Injectable()
export class PortfolioCorrectionsService {
    constructor(
        private readonly llmService: LLMService,
        private readonly ragService: RagService,
        private readonly promptLoader: PromptLoader,
        @InjectRepository(PortfolioCorrection)
        private readonly correctionRepository: Repository<PortfolioCorrection>,
        @InjectRepository(AICorrection)
        private readonly aiCorrectionRepository: Repository<AICorrection>,
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
        @InjectRepository(RAGData)
        private readonly ragDataRepository: Repository<RAGData>
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

    // TODO: 커스텀 에러 생성 필요
    async generateCorrection(
        qr: QueryRunner,
        userId: number,
        correctionId: number,
        selectedProjects: number[]
    ) {
        // selectedProjects가 비어있으면 에러 처리
        if (selectedProjects.length === 0) {
            throw new InternalServerErrorException('프로젝트를 선택해야 합니다.');
        }

        // 프로젝트 최대 선택 개수 제한
        if (selectedProjects.length > parseInt(process.env.MAX_SELECTED_PROJECTS || '6', 10)) {
            throw new InternalServerErrorException(
                `프로젝트는 최대 ${process.env.MAX_SELECTED_PROJECTS || '6'}개까지 선택할 수 있습니다.`
            );
        }

        // correctionId에 해당하는 포트폴리오 첨삭 엔티티가 있는지
        const existCorrectionPortfolio = await qr.manager.findOne(PortfolioCorrection, {
            where: { id: correctionId, user: { id: userId } },
        });
        if (!existCorrectionPortfolio) {
            throw new NotFoundException(`포트폴리오 첨삭이 존재하지 않습니다. ID: ${correctionId}`);
        }

        await Promise.all(
            selectedProjects.map(async (projectId) => {
                // projectId에 해당하는 프로젝트가 있는지 확인
                const project = await qr.manager.findOne(Project, {
                    where: { id: projectId },
                });
                if (!project) {
                    throw new ProjectNotFoundException(
                        `프로젝트가 존재하지 않습니다. ID: ${projectId}`
                    );
                }

                // 프로젝트에 해당하는 마스터 포트폴리오 AI 결과가 있는지 확인
                const portfolioData = await qr.manager.findOne(MasterPortfolioAI, {
                    where: { project: { id: projectId }, user: { id: userId } },
                });
                if (!portfolioData) {
                    throw new NotFoundException(
                        `마스터 포트폴리오 AI 결과가 존재하지 않습니다. 프로젝트 ID: ${projectId}`
                    );
                }

                // 기존 첨삭 결과가 존재하는지 확인
                const existingAICorrection = await qr.manager.findOne(AICorrection, {
                    where: { projectId, portfolioCorrection: { id: correctionId } },
                });
                if (existingAICorrection) {
                    throw new AIGenerationAlreadyExists(
                        `첨삭 ID: ${correctionId}, 프로젝트 ID: ${projectId}`
                    );
                }
            })
        );

        try {
            const correctionPromises = selectedProjects.map(async (projectId) => {
                // 프로젝트에 해당하는 포트폴리오 데이터 조회
                const portfolioData = await qr.manager.findOne(MasterPortfolioAI, {
                    where: { project: { id: projectId }, user: { id: userId } },
                });
                const project = await qr.manager.findOne(Project, {
                    where: { id: projectId },
                    select: ['name'],
                });
                const projectName = project?.name;

                // TODO: 생성 중 실패 시에 롤백 처리 필요
                // 진행 상태 업데이트
                await this.correctionRepository.update(correctionId, {
                    status: PortfolioCorrectionStatus.GENERATING,
                });

                // LLM을 통해 첨삭 생성
                const correctionResult = await this.llmService.generateCorrection(
                    qr,
                    correctionId,
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
                        process.env.LLM_CORRECTION_MODEL ||
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

            // 진행 상태 업데이트
            await qr.manager.update(PortfolioCorrection, correctionId, {
                status: PortfolioCorrectionStatus.DONE,
            });

            return mergedCorrection;
        } catch (error) {
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

        return projects.map(ProjectResponseDto.from);
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

        // 진행 상태 업데이트
        newCorrection.status = PortfolioCorrectionStatus.DOING_RAG;

        return await this.correctionRepository.save(newCorrection);
    }

    async startRAG(qr: QueryRunner, correctionId: number) {
        await checkCorrectionExists(qr, correctionId);

        // TODO: correctionId로 제출처, 직무명, JD 등을 DB에서 가져와 사용
        const companyProfile = await this.ragService.startRAG(qr, correctionId);
        await qr.manager.update(PortfolioCorrection, correctionId, {
            companyInsight: companyProfile,
        });

        // 진행 상태 업데이트
        await qr.manager.update(PortfolioCorrection, correctionId, {
            status: PortfolioCorrectionStatus.COMPANY_INSIGHT,
        });

        return await qr.manager.findOne(PortfolioCorrection, {
            where: { id: correctionId },
        });
    }

    async getRAGData(correctionId: number) {
        const ragData = await this.ragDataRepository.find({
            where: { portfolioCorrection: { id: correctionId } },
        });
        const keywords: string[] = [];
        const links: string[] = [];
        ragData.forEach((item) => {
            if (item.type === RAGDataType.KEYWORD) {
                keywords.push(item.keyword);
            } else if (item.type === RAGDataType.LINK) {
                links.push(item.link);
            }
        });
        return {
            keywords,
            links,
        };
    }

    async getCompanyInsight(correctionId: number) {
        return await this.correctionRepository.findOne({
            where: { id: correctionId },
            select: ['companyInsight'],
        });
    }

    async updateCompanyInsight(qr: QueryRunner, correctionId: number, companyInsight: string) {
        await checkCorrectionExists(qr, correctionId);

        await qr.manager.update(PortfolioCorrection, correctionId, {
            companyInsight,
        });

        return await qr.manager.findOne(PortfolioCorrection, {
            where: { id: correctionId },
        });
    }

    async getCorrectionStatus(correctionId: number) {
        const correction = await this.correctionRepository.findOne({
            where: { id: correctionId },
            select: ['status'],
        });

        if (!correction) {
            throw new NotFoundException(`포트폴리오 첨삭이 존재하지 않습니다. ID: ${correctionId}`);
        }

        return { status: correction.status };
    }
}
