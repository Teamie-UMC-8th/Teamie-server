import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Param,
    ParseArrayPipe,
    ParseIntPipe,
    Patch,
    Post,
    Req,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { MasterPortfoliosService } from './services/master-portfolios.service';
import { User } from 'src/common/decorators/user.decorator';
import { MasterPortfolioRequestDto } from './dtos/master-portfolio-request.dto';
import {
    ApiCommonResponse,
    ApiCommonResponseArray,
} from 'src/common/response/swagger-response.helper';
import { QuestionResponseDto, UpdateQuestionDto } from './dtos/question.dto';
import { MasterPortfolioResponseDto } from './dtos/master-portfolio-response.dto';
import { MasterPortfolioAIResponseDto } from './dtos/master-portfolio-ai-response.dto';
import { Transactional, TransactionalRequest } from 'src/common/decorators/transaction.decorator';
import { CreateQuestions } from './dtos/create-questions.dto';
import { SelectablePlanResponseDto } from './dtos/selectable-plan.dto';
import { ApiCommonErrorResponses } from 'src/common/decorators/api-common-error-responses.decorator';

@ApiTags('MasterPortfolios')
@Controller('master-portfolios')
export class MasterPortfoliosController {
    constructor(private readonly masterPortfoliosService: MasterPortfoliosService) {}

    @ApiOperation({
        summary: '마스터 포트폴리오 진행 상태 조회',
        description: '프로젝트의 마스터 포트폴리오 진행 상태를 조회합니다.',
    })
    @ApiParam({ name: 'portfolioId', type: Number, description: '포트폴리오 ID' })
    @Get(':portfolioId/status')
    async getStatus(@Param('portfolioId', ParseIntPipe) portfolioId: number) {
        return this.masterPortfoliosService.getStatus(portfolioId);
    }

    @ApiOperation({
        summary: '마스터 포트폴리오 질문 AI 생성',
        description: '프로젝트의 마스터 포트폴리오 질문을 AI로 생성합니다.',
    })
    @ApiParam({ name: 'portfolioId', type: Number, description: '포트폴리오 ID' })
    @ApiBody({ type: CreateQuestions })
    @ApiCommonResponseArray(QuestionResponseDto)
    @ApiCommonErrorResponses(HttpStatus.NOT_FOUND, {
        errorCode: 'MASTERPORTFOLIO4041',
        reason: '마스터 포트폴리오를 찾을 수 없습니다.',
    })
    @Transactional()
    @Post(':portfolioId/questions')
    async createQuestions(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('portfolioId', ParseIntPipe) portfolioId: number,
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
        summary: '마스터 포트폴리오 질문 조회',
        description: '프로젝트의 마스터 포트폴리오 질문을 조회합니다.',
    })
    @ApiParam({ name: 'portfolioId', type: Number, description: '포트폴리오 ID' })
    @Get(':portfolioId/questions')
    async getQuestions(@Param('portfolioId', ParseIntPipe) portfolioId: number) {
        return this.masterPortfoliosService.getQuestions(portfolioId);
    }

    @ApiOperation({
        summary: '마스터 포트폴리오 질문(답변) 업데이트',
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

    @ApiOperation({
        summary: '마스터 포트폴리오 AI 생성',
        description: '프로젝트의 마스터 포트폴리오를 AI로 생성합니다.',
    })
    @ApiParam({ name: 'portfolioId', type: Number, description: '포트폴리오 ID' })
    @ApiCommonResponse(MasterPortfolioResponseDto)
    @ApiCommonErrorResponses(HttpStatus.NOT_FOUND, {
        errorCode: 'MASTERPORTFOLIO4041',
        reason: '마스터 포트폴리오를 찾을 수 없습니다.',
    })
    @Transactional()
    @Post(':portfolioId/generate')
    async generateMasterPortfolio(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('portfolioId', ParseIntPipe) portfolioId: number
    ) {
        return this.masterPortfoliosService.generateMasterPortfolio(
            req.queryRunner,
            userId,
            portfolioId
        );
    }

    @ApiOperation({
        summary: '마스터 포트폴리오 AI 생성 결과 조회',
        description: '프로젝트의 마스터 포트폴리오 AI 생성 결과를 조회합니다.',
    })
    @ApiParam({ name: 'portfolioId', type: Number, description: '포트폴리오 ID' })
    @ApiCommonResponse(MasterPortfolioAIResponseDto)
    @ApiCommonErrorResponses(HttpStatus.NOT_FOUND, {
        errorCode: 'MASTERPORTFOLIO4041',
        reason: '마스터 포트폴리오를 찾을 수 없습니다.',
    })
    @Get(':portfolioId/generation-result')
    async getMasterPortfolioGenerationResult(
        @User('id') userId: number,
        @Param('portfolioId', ParseIntPipe) portfolioId: number
    ) {
        return this.masterPortfoliosService.getMasterPortfolioGenerationResult(userId, portfolioId);
    }

    @ApiOperation({
        summary: '마스터 포트폴리오 조회',
        description: '프로젝트의 마스터 포트폴리오를 조회합니다.',
    })
    @ApiParam({ name: 'portfolioId', type: Number, description: '포트폴리오 ID' })
    @ApiCommonResponse(MasterPortfolioResponseDto)
    @ApiCommonErrorResponses(HttpStatus.NOT_FOUND, {
        errorCode: 'MASTERPORTFOLIO4041',
        reason: '마스터 포트폴리오를 찾을 수 없습니다.',
    })
    @Get(':portfolioId')
    async getMasterPortfolio(
        @User('id') userId: number,
        @Param('portfolioId', ParseIntPipe) portfolioId: number
    ) {
        return this.masterPortfoliosService.getMasterPortfolio(userId, portfolioId);
    }

    @ApiOperation({
        summary: '마스터 포트폴리오 업데이트',
        description: '프로젝트의 마스터 포트폴리오를 업데이트합니다.',
    })
    @ApiParam({ name: 'portfolioId', type: Number, description: '포트폴리오 ID' })
    @ApiBody({ type: MasterPortfolioRequestDto })
    @ApiCommonResponse(MasterPortfolioResponseDto)
    @ApiCommonErrorResponses(HttpStatus.NOT_FOUND, {
        errorCode: 'MASTERPORTFOLIO4041',
        reason: '마스터 포트폴리오를 찾을 수 없습니다.',
    })
    @Transactional()
    @Patch(':portfolioId')
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
        summary: '선택 가능한 회의록 조회',
        description: '프로젝트의 일정 중에 사용자가 참여한 일정 목록을 조회합니다.',
    })
    @ApiParam({ name: 'portfolioId', type: Number, description: '포트폴리오 ID' })
    @ApiCommonResponseArray(SelectablePlanResponseDto)
    @ApiCommonErrorResponses(HttpStatus.NOT_FOUND, {
        errorCode: 'MASTERPORTFOLIO4041',
        reason: '마스터 포트폴리오를 찾을 수 없습니다.',
    })
    @Get(':portfolioId/records')
    async getProjectRecords(
        @User('id') userId: number,
        @Param('portfolioId', ParseIntPipe) portfolioId: number
    ) {
        return this.masterPortfoliosService.getProjectRecords(userId, portfolioId);
    }
}
