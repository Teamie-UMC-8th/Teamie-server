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
import { PortfolioCorrectionsService } from './portfolio-corrections.service';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import { ApiCommonResponseWithPagination } from 'src/common/response/swagger-response.helper';
import { PaginatedResponseDto } from 'src/common/response/paginated-response.dto';
import { DateCursor } from 'src/common/dtos/date-cursor.dto';
import { ConfigService } from '@nestjs/config';
import { UserPortfolioCorrectionResponseDto } from './dtos/user-portfolio-correction-response.dto';
import { Transactional, TransactionalRequest } from 'src/common/decorators/transaction.decorator';
import { CreateCorrectionsDto, CreatePortfolioCorrectionDto } from './dtos/create-corrections.dto';
import { UpdateCompanyInsightDto } from './dtos/company-insight.dto';

@ApiTags('PortfolioCorrections')
@Controller('portfolio-corrections')
export class PortfolioCorrectionsController {
    constructor(
        private readonly configService: ConfigService,
        private readonly portfolioCorrectionsService: PortfolioCorrectionsService
    ) {}

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

    @Get('projects')
    async getSelectableProjects(@User('id') userId: number) {
        return await this.portfolioCorrectionsService.getSelectableProjects(userId);
    }

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

    @Get(':correctionId')
    async getCorrection(@Param('correctionId') correctionId: number) {
        return await this.portfolioCorrectionsService.getCorrection(correctionId);
    }

    @Transactional()
    @Post(':correctionId/rag')
    async startRAG(@Req() req: TransactionalRequest, @Param('correctionId') correctionId: number) {
        return await this.portfolioCorrectionsService.startRAG(req.queryRunner, correctionId);
    }

    @Get(':correctionId/rag')
    async getRAGData(@Param('correctionId') correctionId: number) {
        return await this.portfolioCorrectionsService.getRAGData(correctionId);
    }

    @Get(':correctionId/company-insight')
    async getCompanyInsight(@Param('correctionId') correctionId: number) {
        return await this.portfolioCorrectionsService.getCompanyInsight(correctionId);
    }

    @ApiBody({ type: UpdateCompanyInsightDto })
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
