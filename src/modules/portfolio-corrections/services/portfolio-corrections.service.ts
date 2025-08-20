import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { LLMService } from 'src/infra/llm/llm.service';
import { correctionSchema, Correction } from 'src/infra/llm/schemas/portfolio-correction.schema';
import { PortfolioCorrection } from '../entities/portfolio-correction.entity';
import { In, QueryRunner, Repository } from 'typeorm';
import { AICorrection } from '../entities/ai-correction.entity';
import { PaginatedResponseDto } from 'src/common/response/paginated-response.dto';
import { UserPortfolioCorrectionResponseDto } from '../dtos/user-portfolio-correction-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
    AICorrectionNotFoundException,
    AIGenerationAlreadyExists,
    LLMZodErrorException,
    MasterPortfolioAINotFoundException,
    MasterPortfolioNotFoundException,
    PortfolioCorrectionNotFoundException,
    ProjectMaxSelectedException,
    ProjectNotFoundException,
    ProjectNotSelectedException,
    ProjectPortfolioCorrectionNotFoundException,
} from 'src/common/exceptions/custom.errors';
import { Project } from '../../projects/entities/projects.entity';
import { CreatePortfolioCorrectionDto } from '../dtos/create-corrections.dto';
import { RAGData } from '../entities/rag-data.entity';
import { RAGDataType } from 'src/common/enums/rag-data-type.enum';
import { ProjectResponseDto } from '../dtos/project-response.dto';
import { PortfolioCorrectionStatus } from 'src/common/enums/portfolio-correction-status.enum';
import { MasterPortfolioAI } from '../../master-portfolios/entities/master-portfolio-ai.entity';
import { RagService } from 'src/infra/llm/rag.service';
import { PortfolioCorrectionResponseDto } from '../dtos/portfolio-correction-response.dto';
import { RagResponseDto } from '../dtos/rag-response.dto';
import { StatusResponseDto } from '../dtos/status-response.dto';
import { ResponseDelayManager } from 'src/common/utils/response-delay.util';
import { CorrectionResultDto, GetCorrectionResultDto } from '../dtos/correction-result.dto';
import { UpdatePortfolioCorrectionDto } from '../dtos/portfolio-correction.dto';
import { MasterPortfolio } from 'src/modules/master-portfolios/entities/master-portfolios.entity';
import { TransformMasterPortfolioUtil } from 'src/common/utils/transformMasterPortfolio.util';
import { MasterPortfolioOutputDto } from '../dtos/master-portfolio-output.dto';

async function checkCorrectionExists(qr: QueryRunner, correctionId: number) {
    // correctionId에 해당하는 포트폴리오 첨삭 엔티티가 있는지
    const existCorrectionPortfolio = await qr.manager.findOne(PortfolioCorrection, {
        where: { id: correctionId },
    });
    if (!existCorrectionPortfolio) {
        throw new PortfolioCorrectionNotFoundException(correctionId);
    }
}

function removeOriginalContent(correctionData) {
    if (!correctionData) return correctionData;

    const filtered = { ...correctionData };
    Object.keys(filtered).forEach((sectionKey) => {
        if (filtered[sectionKey]?.lines) {
            filtered[sectionKey].lines = filtered[sectionKey].lines.map((line) => {
                const { original_content, ...lineWithoutOriginalContent } = line;
                return lineWithoutOriginalContent;
            });
        }
    });
    return filtered;
}

@Injectable()
export class PortfolioCorrectionsService {
    constructor(
        private readonly llmService: LLMService,
        private readonly ragService: RagService,
        @InjectRepository(PortfolioCorrection)
        private readonly correctionRepository: Repository<PortfolioCorrection>,
        @InjectRepository(AICorrection)
        private readonly aiCorrectionRepository: Repository<AICorrection>,
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
        @InjectRepository(RAGData)
        private readonly ragDataRepository: Repository<RAGData>,
        @InjectRepository(MasterPortfolioAI)
        private readonly masterPortfolioAIRepository: Repository<MasterPortfolioAI>,
        @InjectRepository(MasterPortfolio)
        private readonly masterPortfolioRepository: Repository<MasterPortfolio>
    ) {}
    async getPortfolioCorrectionsByUser(userId: number, cursorDate: Date, pageSize: number) {
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

    async generateCorrection(
        qr: QueryRunner,
        userId: number,
        correctionId: number,
        selectedProjects: number[]
    ) {
        // selectedProjects가 비어있으면 에러 처리
        if (selectedProjects.length === 0) {
            throw new ProjectNotSelectedException();
        }

        // 프로젝트 최대 선택 개수 제한
        if (selectedProjects.length > parseInt(process.env.MAX_SELECTED_PROJECTS || '6', 10)) {
            throw new ProjectMaxSelectedException();
        }

        // correctionId에 해당하는 포트폴리오 첨삭 엔티티가 있는지
        const existCorrectionPortfolio = await qr.manager.findOne(PortfolioCorrection, {
            where: { id: correctionId, user: { id: userId } },
        });
        if (!existCorrectionPortfolio) {
            throw new PortfolioCorrectionNotFoundException(correctionId);
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
                    throw new MasterPortfolioAINotFoundException(`프로젝트 ID: ${projectId}`);
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

        const operation = async () => {
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
                        throw new LLMZodErrorException(`프로젝트 ${projectId}: ${error.message}`);
                    }

                    // DB에 저장
                    await qr.manager.save(AICorrection, {
                        projectId,
                        portfolioCorrection: existCorrectionPortfolio,
                        modelName:
                            process.env.LLM_CORRECTION_MODEL ||
                            'google/gemini-2.5-flash-lite-preview-06-17',
                        llmTemperature: parseFloat(process.env.LLM_CORRECTION_TEMPERATURE || '0.3'),
                        correctionResult: correction,
                    });

                    const result = {
                        projectId,
                        projectName,
                        correction,
                    };
                    // TODO: 수정 필요
                    // return CorrectionResultDto.from(result);
                    return result;
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
        };
        return ResponseDelayManager.ensureMinimumDuration(operation());
    }

    async getSelectableProjects(userId: number) {
        // userId로 project들 조회
        const projects = await this.projectRepository
            .createQueryBuilder('project')
            .innerJoin('project.userProjects', 'userProject')
            .innerJoin('userProject.user', 'user')
            .where('user.id = :userId', { userId })
            .getMany();

        const projectsWithBoolean = await Promise.all(
            projects.map(async (project) => {
                const projectId = project.id;
                const hasMasterPortfolio =
                    (await this.masterPortfolioAIRepository.findOne({
                        where: { project: { id: projectId } },
                    })) !== null;
                return {
                    ...project,
                    hasMasterPortfolio,
                };
            })
        );

        // 반환값이 있으면 1, 없으면 0으로 hasMasterPortfolio 속성 추가

        return projectsWithBoolean.map(ProjectResponseDto.from);
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

        const companyProfile = await this.ragService.startRAG(qr, correctionId);
        await qr.manager.update(PortfolioCorrection, correctionId, {
            companyInsight: companyProfile,
        });

        // 진행 상태 업데이트
        await qr.manager.update(PortfolioCorrection, correctionId, {
            status: PortfolioCorrectionStatus.COMPANY_INSIGHT,
        });

        const createdCorrection = await qr.manager.findOne(PortfolioCorrection, {
            where: { id: correctionId },
        });

        return PortfolioCorrectionResponseDto.fromEntity(createdCorrection);
    }

    async getRAGData(correctionId: number) {
        // correctionId 존재 유무 확인
        const correction = await this.correctionRepository.findOne({
            where: { id: correctionId },
        });
        if (!correction) {
            throw new PortfolioCorrectionNotFoundException(correctionId);
        }

        const ragData = await this.ragDataRepository.find({
            where: { portfolioCorrection: { id: correctionId } },
        });
        const keywords: string[] = [];
        const links: { title: string; url: string }[] = [];
        ragData.forEach((item) => {
            if (item.type === RAGDataType.KEYWORD) {
                keywords.push(item.keyword);
            } else if (item.type === RAGDataType.LINK) {
                links.push({ title: item.title, url: item.link });
            }
        });
        const result = {
            keywords,
            links,
        };
        return RagResponseDto.fromEntity(result);
    }

    async getCompanyInsight(correctionId: number) {
        // correctionId 존재 유무 확인
        const correction = await this.correctionRepository.findOne({
            where: { id: correctionId },
        });
        if (!correction) {
            throw new PortfolioCorrectionNotFoundException(correctionId);
        }

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
            throw new PortfolioCorrectionNotFoundException(correctionId);
        }

        const result = { status: correction.status };
        return StatusResponseDto.fromEntity(result);
    }

    // 생성된 AI 첨삭 결과 조회
    async getCorrection(correctionId: number) {
        // correctionId에 해당하는 포트폴리오 첨삭 엔티티가 있는지
        const existCorrectionPortfolio = await this.correctionRepository.findOne({
            where: { id: correctionId },
        });
        if (!existCorrectionPortfolio) {
            throw new PortfolioCorrectionNotFoundException(correctionId);
        }

        // correctionId에 해당하는 AI 첨삭 엔티티가 있는지
        const existAICorrection = await this.aiCorrectionRepository.findOne({
            where: { portfolioCorrection: { id: correctionId } },
        });
        if (!existAICorrection) {
            throw new AICorrectionNotFoundException(correctionId);
        }

        // correctionId에 해당하는 모든 AI 첨삭 결과의 projectId를 가져옴
        const projectInfo = await this.aiCorrectionRepository.find({
            where: { portfolioCorrection: { id: correctionId } },
            select: ['projectId'],
        });
        const projectIds = projectInfo.map((item) => item.projectId);

        // { id, name } 객체로 반환
        const projects = await this.projectRepository.find({
            where: { id: In(projectIds) },
            select: ['id', 'name', 'createdAt'],
            order: { createdAt: 'DESC' }, // 최신순으로 정렬
        });
        const projectList = projects.map((project) => ({
            id: project.id,
            name: project.name,
        }));

        const result = await this.aiCorrectionRepository.findOne({
            where: { portfolioCorrection: { id: correctionId }, projectId: projectList[0].id },
        });

        const filteredResult = removeOriginalContent(result?.correctionResult);

        const final = {
            projects: projectList,
            firstCorrection: {
                ...result,
                correctionResult: filteredResult,
            },
        };
        return GetCorrectionResultDto.from(final);
    }

    // 개별 조회
    async getCorrectionById(correctionId: number, projectId: number) {
        // 존재 유무 체크
        const existCorrectionPortfolio = await this.aiCorrectionRepository.findOne({
            where: { portfolioCorrection: { id: correctionId }, projectId: projectId },
        });
        if (!existCorrectionPortfolio) {
            throw new ProjectPortfolioCorrectionNotFoundException(correctionId);
        }

        const result = await this.aiCorrectionRepository.findOne({
            where: { portfolioCorrection: { id: correctionId }, projectId: projectId },
        });

        const filteredResult = removeOriginalContent(result?.correctionResult);

        return CorrectionResultDto.from({
            ...result,
            correctionResult: filteredResult,
        });
    }

    // 포트폴리오 첨삭 업데이트
    async updatePortfolioCorrection(
        qr: QueryRunner,
        correctionId: number,
        updatePortfolioCorrectionDto: UpdatePortfolioCorrectionDto
    ) {
        await checkCorrectionExists(qr, correctionId);

        await qr.manager.update(
            PortfolioCorrection,
            {
                id: correctionId,
            },
            {
                title: updatePortfolioCorrectionDto.title,
            }
        );

        return {
            id: correctionId,
            title: updatePortfolioCorrectionDto.title,
        };
    }

    // 포트폴리오 첨삭 조회
    async getPortfolioCorrection(correctionId: number) {
        const correction = await this.correctionRepository.findOne({
            where: { id: correctionId },
        });
        if (!correction) {
            throw new PortfolioCorrectionNotFoundException(correctionId);
        }

        return PortfolioCorrectionResponseDto.fromEntity(correction);
    }

    // 포트폴리오 첨삭 삭제
    async deletePortfolioCorrection(correctionId: number) {
        const result = await this.correctionRepository.delete({ id: correctionId });
        if (result.affected === 0) {
            throw new PortfolioCorrectionNotFoundException(correctionId);
        }
        return `포트폴리오 첨삭 id ${correctionId}가 성공적으로 삭제되었습니다.`;
    }

    // AI 첨삭 페이지에서 projectId로 마스터 포트폴리오 개별 조회
    async getMasterPortfolio(userId: number, projectId: number) {
        const masterPortfolio = await this.masterPortfolioRepository.findOne({
            where: { user: { id: userId }, project: { id: projectId } },
        });
        if (!masterPortfolio) {
            throw new MasterPortfolioNotFoundException(`프로젝트 ID: ${projectId}`);
        }
        const input = {
            detailInfo: masterPortfolio.detailInfo || '',
            assignedTask: masterPortfolio.assignedTask || '',
            keyAchievement: masterPortfolio.keyAchievement || '',
            insight: masterPortfolio.insight || '',
        };

        const result = TransformMasterPortfolioUtil.transformMasterPortfolio(input);
        return MasterPortfolioOutputDto.from(result);
    }
}
