import {
    Body,
    Controller,
    Get,
    Param,
    ParseArrayPipe,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Req,
    ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PaginatedResponseDto } from 'src/common/response/paginated-response.dto';
import { UserMasterPortfoliosResponseDto } from './dtos/user-master-portfolios-response.dto';
import { MasterPortfoliosService } from './services/master-portfolios.service';
import { User } from 'src/common/decorators/user.decorator';
import { MasterPortfolioRequestDto } from './dtos/master-portfolio-request.dto';
import {
    ApiCommonErrorResponse,
    ApiCommonResponse,
    ApiCommonResponseArray,
    ApiCommonResponseWithPagination,
} from 'src/common/response/swagger-response.helper';
import { QuestionResponseDto, UpdateQuestionDto } from './dtos/question.dto';
import { MasterPortfolioResponseDto } from './dtos/master-portfolio-response.dto';
import { DateCursor } from 'src/common/dtos/date-cursor.dto';
import { MasterPortfolioAIResponseDto } from './dtos/master-portfolio-ai-response.dto';
import { Transactional, TransactionalRequest } from 'src/common/decorators/transaction.decorator';
import { CreateQuestions } from './dtos/create-questions.dto';
import { SelectablePlanResponseDto } from './dtos/selectable-plan.dto';

@ApiTags('MasterPortfolios')
@Controller('master-portfolios')
export class MasterPortfoliosController {
    constructor(
        private readonly configService: ConfigService,
        private readonly masterPortfoliosService: MasterPortfoliosService
    ) {}

    @ApiOperation({
        summary: '마이페이지/사용자 별 마스터포트폴리오 조회 API',
        description:
            '사용자의 마스터포트폴리오 리스트를 조회하는 API입니다. 페이징을 포함하며, 커서는 프로젝트 생성일자입니다.',
    })
    @ApiCommonResponseWithPagination(UserMasterPortfoliosResponseDto)
    @Get('/me')
    async getUsersMasterPortfolios(
        @User('id') userId: number,
        @Query(new ValidationPipe({ transform: true })) req: DateCursor
    ): Promise<PaginatedResponseDto<UserMasterPortfoliosResponseDto>> {
        //파라미터의 기본값 처리
        const cursorDate = req.cursor ? new Date(req.cursor) : new Date(); //NOTE: 커서의 디폴트 값은 now
        const pageSize = Number(this.configService.get('PAGE_SIZE')) || 20;
        return await this.masterPortfoliosService.getMasterPortfoliosByUser(
            userId,
            cursorDate,
            pageSize
        );
    }

    @ApiOperation({
        summary: '마스터 포트폴리오 진행 상태 조회 API',
        description: '프로젝트의 마스터 포트폴리오 진행 상태를 조회합니다.',
    })
    @ApiParam({ name: 'portfolioId', type: Number, description: '포트폴리오 ID' })
    @Get(':portfolioId/status')
    async getStatus(@Param('portfolioId', ParseIntPipe) portfolioId: number) {
        return this.masterPortfoliosService.getStatus(portfolioId);
    }

    @Post(':portfolioId/questions')
    @ApiOperation({
        summary: '마스터 포트폴리오 질문 AI 생성 API',
        description: '프로젝트의 마스터 포트폴리오 질문을 AI로 생성합니다.',
    })
    @ApiParam({ name: 'portfolioId', type: Number, description: '포트폴리오 ID' })
    @ApiBody({ type: CreateQuestions })
    @ApiCommonResponseArray(QuestionResponseDto)
    @ApiCommonErrorResponse(
        'MASTER_PORTFOLIO_NOT_FOUND',
        '마스터 포트폴리오를 찾을 수 없습니다.',
        404
    )
    @Transactional()
    async createQuestions(
        @Req() req: TransactionalRequest,
        @Param('portfolioId', ParseIntPipe) portfolioId: number,
        @User('id') userId: number,
        @Body() createQuestionsDto: CreateQuestions
    ) {
        return this.masterPortfoliosService.createQuestions(
            req.queryRunner,
            userId,
            portfolioId,
            createQuestionsDto.recordIdList
        );
    }

    @ApiOperation({
        summary: '마스터 포트폴리오 질문 조회 API',
        description: '프로젝트의 마스터 포트폴리오 질문을 조회합니다.',
    })
    @ApiParam({ name: 'portfolioId', type: Number, description: '포트폴리오 ID' })
    @Get(':portfolioId/questions')
    async getQuestions(@Param('portfolioId', ParseIntPipe) portfolioId: number) {
        return this.masterPortfoliosService.getQuestions(portfolioId);
    }

    @ApiOperation({
        summary: '마스터 포트폴리오 질문(답변) 업데이트 API',
        description: '프로젝트의 마스터 포트폴리오 질문에 대한 답변을 업데이트합니다.',
    })
    @ApiBody({ type: UpdateQuestionDto, isArray: true })
    @ApiParam({ name: 'portfolioId', type: Number, description: '포트폴리오 ID' })
    @Transactional()
    @Patch(':portfolioId/questions')
    async updateQuestions(
        @Req() req: TransactionalRequest,
        @Param('portfolioId', ParseIntPipe) portfolioId: number,
        @Body(new ParseArrayPipe({ items: UpdateQuestionDto, optional: true }))
        questions: UpdateQuestionDto[]
    ) {
        return this.masterPortfoliosService.updateQuestions(
            req.queryRunner,
            portfolioId,
            questions
        );
    }

    @Post(':portfolioId/generate')
    @ApiOperation({
        summary: '마스터 포트폴리오 AI 생성 API',
        description: '프로젝트의 마스터 포트폴리오를 AI로 생성합니다.',
    })
    @ApiParam({ name: 'portfolioId', type: Number, description: '포트폴리오 ID' })
    @ApiCommonResponse(MasterPortfolioResponseDto)
    @ApiCommonErrorResponse(
        'MASTER_PORTFOLIO_NOT_FOUND',
        '마스터 포트폴리오를 찾을 수 없습니다.',
        404
    )
    @Transactional()
    async generateMasterPortfolio(
        @Req() req: TransactionalRequest,
        @Param('portfolioId', ParseIntPipe) portfolioId: number,
        @User('id') userId: number
    ) {
        return this.masterPortfoliosService.generateMasterPortfolio(
            req.queryRunner,
            userId,
            portfolioId
        );
    }

    @Get(':portfolioId/generation-result')
    @ApiOperation({
        summary: '마스터 포트폴리오 AI 생성 결과 조회 API',
        description: '프로젝트의 마스터 포트폴리오 AI 생성 결과를 조회합니다.',
    })
    @ApiParam({ name: 'portfolioId', type: Number, description: '포트폴리오 ID' })
    @ApiCommonResponse(MasterPortfolioAIResponseDto)
    @ApiCommonErrorResponse(
        'MASTER_PORTFOLIO_NOT_FOUND',
        '마스터 포트폴리오를 찾을 수 없습니다.',
        404
    )
    async getMasterPortfolioGenerationResult(
        @Param('portfolioId', ParseIntPipe) portfolioId: number,
        @User('id') userId: number
    ) {
        return this.masterPortfoliosService.getMasterPortfolioGenerationResult(userId, portfolioId);
    }

    @Get(':portfolioId')
    @ApiOperation({
        summary: '마스터 포트폴리오 조회 API',
        description: '프로젝트의 마스터 포트폴리오를 조회합니다.',
    })
    @ApiParam({ name: 'portfolioId', type: Number, description: '포트폴리오 ID' })
    @ApiCommonResponse(MasterPortfolioResponseDto)
    @ApiCommonErrorResponse(
        'MASTER_PORTFOLIO_NOT_FOUND',
        '마스터 포트폴리오를 찾을 수 없습니다.',
        404
    )
    async getMasterPortfolio(
        @Param('portfolioId', ParseIntPipe) portfolioId: number,
        @User('id') userId: number
    ) {
        return this.masterPortfoliosService.getMasterPortfolio(userId, portfolioId);
    }

    @Patch(':portfolioId')
    @ApiOperation({
        summary: '마스터 포트폴리오 업데이트 API',
        description: '프로젝트의 마스터 포트폴리오를 업데이트합니다.',
    })
    @ApiParam({ name: 'portfolioId', type: Number, description: '포트폴리오 ID' })
    @ApiBody({ type: MasterPortfolioRequestDto })
    @ApiCommonResponse(MasterPortfolioResponseDto)
    @ApiCommonErrorResponse(
        'MASTER_PORTFOLIO_NOT_FOUND',
        '마스터 포트폴리오를 찾을 수 없습니다.',
        404
    )
    @Transactional()
    async updateMasterPortfolio(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('portfolioId', ParseIntPipe) portfolioId: number,
        @Body() updateDataDto: MasterPortfolioRequestDto
    ) {
        console.log(updateDataDto);
        return this.masterPortfoliosService.updateMasterPortfolio(
            req.queryRunner,
            userId,
            portfolioId,
            updateDataDto
        );
    }

    // 선택 가능한 회의록 조회 API
    @ApiOperation({
        summary: '선택 가능한 회의록 조회 API',
        description: '프로젝트의 일정 중에 사용자가 참여한 일정 목록을 조회합니다.',
    })
    @ApiParam({ name: 'portfolioId', type: Number, description: '포트폴리오 ID' })
    @ApiCommonResponseArray(SelectablePlanResponseDto)
    @Get(':portfolioId/records')
    async getProjectRecords(
        @User('id') userId: number,
        @Param('portfolioId', ParseIntPipe) portfolioId: number
    ) {
        return this.masterPortfoliosService.getProjectRecords(userId, portfolioId);
    }
}
