import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Req,
    HttpStatus,
    Delete,
} from '@nestjs/common';
import { PortfolioCorrectionsService } from './services/portfolio-corrections.service';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import {
    ApiCommonResponse,
    ApiCommonResponseArray,
} from 'src/common/response/swagger-response.helper';
import { Transactional, TransactionalRequest } from 'src/common/decorators/transaction.decorator';
import { CreateCorrectionsDto, CreatePortfolioCorrectionDto } from './dtos/create-corrections.dto';
import { UpdateCompanyInsightDto } from './dtos/company-insight.dto';
import { ProjectResponseDto } from './dtos/project-response.dto';
import { PortfolioCorrectionResponseDto } from './dtos/portfolio-correction-response.dto';
import { RagResponseDto } from './dtos/rag-response.dto';
import { CompanyInsightResponseDto } from './dtos/company-insight-response.dto';
import { CorrectionResultDto, GetCorrectionResultDto } from './dtos/correction-result.dto';
import { StatusResponseDto } from './dtos/status-response.dto';
import { ApiCommonErrorResponses } from 'src/common/decorators/api-common-error-responses.decorator';
import { UpdatePortfolioCorrectionDto } from './dtos/portfolio-correction.dto';

@ApiTags('PortfolioCorrections')
@Controller('portfolio-corrections')
export class PortfolioCorrectionsController {
    constructor(private readonly portfolioCorrectionsService: PortfolioCorrectionsService) {}

    @ApiOperation({
        summary: '(1-1) 포트폴리오 첨삭 생성',
        description: '사용자가 포트폴리오 첨삭을 생성합니다.',
    })
    @ApiBody({ type: CreatePortfolioCorrectionDto })
    @ApiCommonResponse(PortfolioCorrectionResponseDto)
    @Post()
    async createPortfolioCorrection(
        @User('id') userId: number,
        @Body() createPortfolioCorrectionDto: CreatePortfolioCorrectionDto
    ) {
        return await this.portfolioCorrectionsService.createPortfolioCorrection(
            userId,
            createPortfolioCorrectionDto
        );
    }

    @ApiOperation({
        summary: '(3-1) 사용자 별 선택 가능한 프로젝트 조회',
        description: '사용자가 선택할 수 있는 프로젝트 리스트를 조회하는 API입니다.',
    })
    @ApiCommonResponseArray(ProjectResponseDto)
    @Get('projects')
    async getSelectableProjects(@User('id') userId: number) {
        return await this.portfolioCorrectionsService.getSelectableProjects(userId);
    }

    @ApiOperation({
        summary: '포트폴리오 첨삭 수정',
        description: '사용자가 포트폴리오 첨삭을 수정합니다.',
    })
    @ApiParam({ name: 'correctionId', type: Number, description: '포트폴리오 첨삭 ID' })
    @ApiBody({ type: UpdatePortfolioCorrectionDto })
    @ApiCommonErrorResponses(HttpStatus.NOT_FOUND, {
        errorCode: 'PORTFOLIOCORRECTION4041',
        reason: '포트폴리오 첨삭을 찾을 수 없습니다.',
    })
    @Transactional()
    @Patch(':correctionId')
    async updatePortfolioCorrection(
        @Req() req: TransactionalRequest,
        @Param('correctionId', ParseIntPipe) correctionId: number,
        @Body() updatePortfolioCorrectionDto: UpdatePortfolioCorrectionDto
    ) {
        return await this.portfolioCorrectionsService.updatePortfolioCorrection(
            req.queryRunner,
            correctionId,
            updatePortfolioCorrectionDto
        );
    }

    @ApiOperation({
        summary: '포트폴리오 첨삭 조회',
        description: '특정 포트폴리오 첨삭의 정보를 조회합니다.',
    })
    @ApiParam({ name: 'correctionId', type: Number, description: '포트폴리오 첨삭 ID' })
    @ApiCommonErrorResponses(HttpStatus.NOT_FOUND, {
        errorCode: 'PORTFOLIOCORRECTION4041',
        reason: '포트폴리오 첨삭을 찾을 수 없습니다.',
    })
    @Get(':correctionId')
    async getPortfolioCorrection(@Param('correctionId', ParseIntPipe) correctionId: number) {
        return await this.portfolioCorrectionsService.getPortfolioCorrection(correctionId);
    }

    @ApiOperation({
        summary: '포트폴리오 첨삭 삭제',
        description: '특정 포트폴리오 첨삭을 삭제합니다.',
    })
    @ApiParam({ name: 'correctionId', type: Number, description: '포트폴리오 첨삭 ID' })
    @ApiCommonErrorResponses(HttpStatus.NOT_FOUND, {
        errorCode: 'PORTFOLIOCORRECTION4041',
        reason: '포트폴리오 첨삭을 찾을 수 없습니다.',
    })
    @Delete(':correctionId')
    async deletePortfolioCorrection(@Param('correctionId', ParseIntPipe) correctionId: number) {
        return await this.portfolioCorrectionsService.deletePortfolioCorrection(correctionId);
    }

    @ApiOperation({
        summary: '(3-2) AI 첨삭 생성',
        description: '사용자가 선택한 프로젝트들에 대해 AI 첨삭을 생성합니다.',
    })
    @ApiParam({ name: 'correctionId', type: Number, description: '포트폴리오 첨삭 ID' })
    @ApiCommonResponseArray(CorrectionResultDto)
    @ApiCommonErrorResponses(HttpStatus.BAD_REQUEST, [
        {
            errorCode: 'PORTFOLIOCORRECTION4001',
            reason: '프로젝트를 선택해야 합니다.',
        },
        {
            errorCode: 'PORTFOLIOCORRECTION4002',
            reason: '프로젝트는 최대 6개까지 선택할 수 있습니다.',
        },
    ])
    @ApiCommonErrorResponses(HttpStatus.NOT_FOUND, [
        {
            errorCode: 'PORTFOLIOCORRECTION4041',
            reason: '포트폴리오 첨삭을 찾을 수 없습니다.',
        },
        {
            errorCode: 'PROJECT4041',
            reason: '프로젝트를 찾을 수 없습니다.',
        },
        {
            errorCode: 'MASTERPORTFOLIO4042',
            reason: '마스터포트폴리오 AI 결과를 찾을 수 없습니다.',
        },
    ])
    @ApiCommonErrorResponses(HttpStatus.CONFLICT, {
        errorCode: 'LLM4091',
        reason: 'AI 생성 결과가 이미 존재합니다.',
    })
    @Transactional()
    @Post(':correctionId/generate')
    async generateCorrection(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('correctionId', ParseIntPipe) correctionId: number,
        @Body() createCorrectionDto: CreateCorrectionsDto
    ) {
        return await this.portfolioCorrectionsService.generateCorrection(
            req.queryRunner,
            userId,
            correctionId,
            createCorrectionDto.selectedProjects
        );
    }

    @ApiOperation({
        summary: 'AI 첨삭 상태 조회',
        description: '특정 AI 첨삭의 상태를 조회합니다.',
    })
    @ApiParam({ name: 'correctionId', type: Number, description: '포트폴리오 첨삭 ID' })
    @ApiCommonResponse(StatusResponseDto)
    @ApiCommonErrorResponses(HttpStatus.NOT_FOUND, {
        errorCode: 'PORTFOLIOCORRECTION4041',
        reason: '포트폴리오 첨삭을 찾을 수 없습니다.',
    })
    @Get(':correctionId/status')
    async getCorrectionStatus(@Param('correctionId', ParseIntPipe) correctionId: number) {
        return await this.portfolioCorrectionsService.getCorrectionStatus(correctionId);
    }

    @ApiOperation({
        summary: '(1-2) RAG 시작',
        description:
            'RAG를 진행합니다. 키워드 및 관련 데이터를 생성/수집하고, 최종적으로 기업 분석 정보를 생성합니다.',
    })
    @ApiParam({ name: 'correctionId', type: Number, description: '포트폴리오 첨삭 ID' })
    @ApiCommonResponse(PortfolioCorrectionResponseDto)
    @ApiCommonErrorResponses(HttpStatus.NOT_FOUND, {
        errorCode: 'PORTFOLIOCORRECTION4041',
        reason: '포트폴리오 첨삭을 찾을 수 없습니다.',
    })
    @Transactional()
    @Post(':correctionId/rag')
    async startRAG(
        @Req() req: TransactionalRequest,
        @Param('correctionId', ParseIntPipe) correctionId: number
    ) {
        return await this.portfolioCorrectionsService.startRAG(req.queryRunner, correctionId);
    }

    @ApiOperation({
        summary: '(2-1) RAG 데이터 조회',
        description: '특정 AI 첨삭의 RAG 데이터를 조회합니다.',
    })
    @ApiParam({ name: 'correctionId', type: Number, description: '포트폴리오 첨삭 ID' })
    @ApiCommonResponse(RagResponseDto)
    @Get(':correctionId/rag')
    async getRAGData(@Param('correctionId', ParseIntPipe) correctionId: number) {
        return await this.portfolioCorrectionsService.getRAGData(correctionId);
    }

    @ApiOperation({
        summary: '(2-2) 기업 분석 정보 조회',
        description: '특정 AI 첨삭의 기업 분석 정보를 조회합니다.',
    })
    @ApiCommonResponse(CompanyInsightResponseDto)
    @ApiParam({ name: 'correctionId', type: Number, description: '포트폴리오 첨삭 ID' })
    @ApiCommonErrorResponses(HttpStatus.NOT_FOUND, {
        errorCode: 'PORTFOLIOCORRECTION4041',
        reason: '포트폴리오 첨삭을 찾을 수 없습니다.',
    })
    @Get(':correctionId/company-insight')
    async getCompanyInsight(@Param('correctionId', ParseIntPipe) correctionId: number) {
        return await this.portfolioCorrectionsService.getCompanyInsight(correctionId);
    }

    @ApiOperation({
        summary: '(2-3) 기업 분석 정보 업데이트 API',
        description: '특정 AI 첨삭의 기업 분석 정보를 업데이트합니다.',
    })
    @ApiBody({ type: UpdateCompanyInsightDto })
    @ApiParam({ name: 'correctionId', type: Number, description: '포트폴리오 첨삭 ID' })
    @ApiCommonResponse(PortfolioCorrectionResponseDto)
    @ApiCommonErrorResponses(HttpStatus.NOT_FOUND, {
        errorCode: 'PORTFOLIOCORRECTION4041',
        reason: '포트폴리오 첨삭을 찾을 수 없습니다.',
    })
    @Transactional()
    @Patch(':correctionId/company-insight')
    async updateCompanyInsight(
        @Req() req: TransactionalRequest,
        @Param('correctionId', ParseIntPipe) correctionId: number,
        @Body() updateCompanyInsightDto: UpdateCompanyInsightDto
    ) {
        return await this.portfolioCorrectionsService.updateCompanyInsight(
            req.queryRunner,
            correctionId,
            updateCompanyInsightDto.companyInsight
        );
    }

    // 결과 첫 조회 API
    @ApiOperation({
        summary: '(4-1) AI 첨삭 결과 조회',
        description: '전체 프로젝트 목록과 첫 프로젝트에 대한 첨삭 결과를 조회합니다.',
    })
    @ApiParam({ name: 'correctionId', type: Number, description: '포트폴리오 첨삭 ID' })
    @ApiCommonResponse(GetCorrectionResultDto)
    @ApiCommonErrorResponses(HttpStatus.NOT_FOUND, [
        {
            errorCode: 'PORTFOLIOCORRECTION4041',
            reason: '포트폴리오 첨삭을 찾을 수 없습니다.',
        },
        {
            errorCode: 'PORTFOLIOCORRECTION4042',
            reason: 'AI 첨삭 결과를 찾을 수 없습니다.',
        },
    ])
    @Get(':correctionId/results')
    async getCorrection(@Param('correctionId', ParseIntPipe) correctionId: number) {
        return await this.portfolioCorrectionsService.getCorrection(correctionId);
    }

    // 결과 개별 조회 API
    @ApiOperation({
        summary: '(4-2) AI 첨삭 결과 개별 조회',
        description: '특정 AI 첨삭의 결과를 개별적으로 조회합니다.',
    })
    @ApiParam({ name: 'correctionId', type: Number, description: '포트폴리오 첨삭 ID' })
    @ApiParam({ name: 'projectId', type: Number, description: '프로젝트 ID' })
    @ApiCommonResponse(CorrectionResultDto)
    @ApiCommonErrorResponses(HttpStatus.NOT_FOUND, {
        errorCode: 'PORTFOLIOCORRECTION4042',
        reason: 'AI 첨삭 결과를 찾을 수 없습니다.',
    })
    @Get(':correctionId/:projectId')
    async getCorrectionById(
        @Param('correctionId', ParseIntPipe) correctionId: number,
        @Param('projectId', ParseIntPipe) projectId: number
    ) {
        return await this.portfolioCorrectionsService.getCorrectionById(correctionId, projectId);
    }
}
