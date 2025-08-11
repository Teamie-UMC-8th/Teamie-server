import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    ValidationPipe,
} from '@nestjs/common';
import { PortfolioCorrectionsService } from './services/portfolio-corrections.service';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import {
    ApiCommonResponse,
    ApiCommonResponseArray,
    ApiCommonResponseWithPagination,
} from 'src/common/response/swagger-response.helper';
import { PaginatedResponseDto } from 'src/common/response/paginated-response.dto';
import { DateCursor } from 'src/common/dtos/date-cursor.dto';
import { ConfigService } from '@nestjs/config';
import { UserPortfolioCorrectionResponseDto } from './dtos/user-portfolio-correction-response.dto';
import { Transactional, TransactionalRequest } from 'src/common/decorators/transaction.decorator';
import { CreateCorrectionsDto, CreatePortfolioCorrectionDto } from './dtos/create-corrections.dto';
import { UpdateCompanyInsightDto } from './dtos/company-insight.dto';
import { ProjectResponseDto } from './dtos/project-response.dto';
import { PortfolioCorrectionResponseDto } from './dtos/portfolio-correction-response.dto';
import { RagResponseDto } from './dtos/rag-response.dto';
import { CompanyInsightResponseDto } from './dtos/company-insight-response.dto';
import { CorrectionResultDto } from './dtos/correction-result.dto';
import { StatusResponseDto } from './dtos/status-response.dto';

@ApiTags('PortfolioCorrections')
@Controller('portfolio-corrections')
export class PortfolioCorrectionsController {
    constructor(
        private readonly configService: ConfigService,
        private readonly portfolioCorrectionsService: PortfolioCorrectionsService
    ) {}

    @ApiOperation({
        summary: '(1-1) 포트폴리오 첨삭 생성 API',
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

    @Get('/me')
    @ApiOperation({
        summary: '마이페이지/사용자 별 AI 첨삭 조회 API',
        description:
            '사용자의 AI 첨삭 리스트를 조회하는 API입니다. 페이징을 포함하며, 커서는 AI 첨삭 생성일자입니다.',
    })
    @ApiCommonResponseWithPagination(UserPortfolioCorrectionResponseDto)
    async getUsersFinalPortfolios(
        @Query(new ValidationPipe({ transform: true })) req: DateCursor,
        @User('id') userId: number
    ): Promise<PaginatedResponseDto<UserPortfolioCorrectionResponseDto>> {
        //파라미터의 기본값 처리
        const cursorDate = req.cursor ? new Date(req.cursor) : new Date(); //NOTE: 커서의 디폴트 값은 now
        const pageSize = Number(this.configService.get('PAGE_SIZE')) || 20;
        return await this.portfolioCorrectionsService.getFinalPortfoliosByUser(
            userId,
            cursorDate,
            pageSize
        );
    }

    @ApiOperation({
        summary: '(3-1) 사용자 별 선택 가능한 프로젝트 조회 API',
        description: '사용자가 선택할 수 있는 프로젝트 리스트를 조회하는 API입니다.',
    })
    @ApiCommonResponseArray(ProjectResponseDto)
    @Get('projects')
    async getSelectableProjects(@User('id') userId: number) {
        return await this.portfolioCorrectionsService.getSelectableProjects(userId);
    }

    @ApiOperation({
        summary: '(3-2) AI 첨삭 생성 API',
        description: '사용자가 선택한 프로젝트들에 대해 AI 첨삭을 생성합니다.',
    })
    @ApiParam({ name: 'correctionId', type: Number, description: '포트폴리오 첨삭 ID' })
    @ApiCommonResponseArray(CorrectionResultDto)
    @Transactional()
    @Post(':correctionId/generate')
    async generateCorrection(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('correctionId') correctionId: number,
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
        summary: 'AI 첨삭 상태 조회 API',
        description: '특정 AI 첨삭의 상태를 조회합니다.',
    })
    @ApiParam({ name: 'correctionId', type: Number, description: '포트폴리오 첨삭 ID' })
    @ApiCommonResponse(StatusResponseDto)
    @Get(':correctionId/status')
    async getCorrectionStatus(@Param('correctionId') correctionId: number) {
        return await this.portfolioCorrectionsService.getCorrectionStatus(correctionId);
    }

    @ApiOperation({
        summary: '(4-1 / 분리 예정) AI 첨삭 결과 조회 API',
        description: '특정 AI 첨삭의 결과를 조회합니다.',
    })
    @ApiParam({ name: 'correctionId', type: Number, description: '포트폴리오 첨삭 ID' })
    @Get(':correctionId')
    async getCorrection(@Param('correctionId') correctionId: number) {
        return await this.portfolioCorrectionsService.getCorrection(correctionId);
    }

    @ApiOperation({
        summary: '(1-2) RAG 시작 API',
        description:
            'RAG를 진행합니다. 키워드 및 관련 데이터를 생성/수집하고, 최종적으로 기업 분석 정보를 생성합니다.',
    })
    @ApiParam({ name: 'correctionId', type: Number, description: '포트폴리오 첨삭 ID' })
    @ApiCommonResponse(PortfolioCorrectionResponseDto)
    @Transactional()
    @Post(':correctionId/rag')
    async startRAG(@Req() req: TransactionalRequest, @Param('correctionId') correctionId: number) {
        return await this.portfolioCorrectionsService.startRAG(req.queryRunner, correctionId);
    }

    @ApiOperation({
        summary: '(2-1) RAG 데이터 조회 API',
        description: '특정 AI 첨삭의 RAG 데이터를 조회합니다.',
    })
    @ApiParam({ name: 'correctionId', type: Number, description: '포트폴리오 첨삭 ID' })
    @ApiCommonResponse(RagResponseDto)
    @Get(':correctionId/rag')
    async getRAGData(@Param('correctionId') correctionId: number) {
        return await this.portfolioCorrectionsService.getRAGData(correctionId);
    }

    @ApiOperation({
        summary: '(2-2) 기업 분석 정보 조회 API',
        description: '특정 AI 첨삭의 기업 분석 정보를 조회합니다.',
    })
    @ApiCommonResponse(CompanyInsightResponseDto)
    @ApiParam({ name: 'correctionId', type: Number, description: '포트폴리오 첨삭 ID' })
    @Get(':correctionId/company-insight')
    async getCompanyInsight(@Param('correctionId') correctionId: number) {
        return await this.portfolioCorrectionsService.getCompanyInsight(correctionId);
    }

    @ApiOperation({
        summary: '(2-3) 기업 분석 정보 업데이트 API',
        description: '특정 AI 첨삭의 기업 분석 정보를 업데이트합니다.',
    })
    @ApiBody({ type: UpdateCompanyInsightDto })
    @ApiParam({ name: 'correctionId', type: Number, description: '포트폴리오 첨삭 ID' })
    @ApiCommonResponse(PortfolioCorrectionResponseDto)
    @Transactional()
    @Patch(':correctionId/company-insight')
    async updateCompanyInsight(
        @Req() req: TransactionalRequest,
        @Param('correctionId') correctionId: number,
        @Body() updateCompanyInsightDto: UpdateCompanyInsightDto
    ) {
        return await this.portfolioCorrectionsService.updateCompanyInsight(
            req.queryRunner,
            correctionId,
            updateCompanyInsightDto.companyInsight
        );
    }
}
