import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PaginatedResponseDto } from 'src/common/response/paginated-response.dto';
import {
    Cursor,
    UserMasterPortfoliosResponseDto,
} from './dtos/user-master-portfolios-response.dto';
import { MasterPortfoliosService } from './master-portfolios.service';
import { User } from 'src/common/decorators/user.decorator';
import { MasterPortfolioRequestDto } from './dtos/master-portfolio-request.dto';
import {
    ApiCommonErrorResponse,
    ApiCommonResponse,
    ApiCommonResponseArray,
    ApiCommonResponseWithPagination,
} from 'src/common/response/swagger-response.helper';
import { QuestionResponseDto } from './dtos/question-response.dto';
import { MasterPortfolioResponseDto } from './dtos/master-portfolio-response.dto';

@ApiTags('MasterPortfolios')
@ApiBearerAuth('access-token')
@Controller('master-portfolios')
export class MasterPortfoliosController {
    constructor(
        private readonly configService: ConfigService,
        private readonly masterPortfoliosService: MasterPortfoliosService
    ) {}

    @Post(':projectId/questions')
    @ApiOperation({
        summary: '마스터 포트폴리오 질문 AI 생성 API',
        description: '프로젝트의 마스터 포트폴리오 질문을 AI로 생성합니다.',
    })
    @ApiParam({ name: 'projectId', type: Number, description: '프로젝트 ID' })
    @ApiCommonResponseArray(QuestionResponseDto)
    @ApiCommonErrorResponse(
        'MASTER_PORTFOLIO_NOT_FOUND',
        '마스터 포트폴리오를 찾을 수 없습니다.',
        404
    )
    async createQuestions(
        @Param('projectId', ParseIntPipe) projectId: number,
        @User('id') userId: number
    ) {
        return this.masterPortfoliosService.createQuestions(userId, projectId);
    }

    @Post(':projectId/generate')
    @ApiOperation({
        summary: '마스터 포트폴리오 AI 생성 API',
        description: '프로젝트의 마스터 포트폴리오를 AI로 생성합니다.',
    })
    @ApiParam({ name: 'projectId', type: Number, description: '프로젝트 ID' })
    @ApiCommonResponse(MasterPortfolioResponseDto)
    @ApiCommonErrorResponse(
        'MASTER_PORTFOLIO_NOT_FOUND',
        '마스터 포트폴리오를 찾을 수 없습니다.',
        404
    )
    async generateMasterPortfolio(
        @Param('projectId', ParseIntPipe) projectId: number,
        @User('id') userId: number
    ) {
        return this.masterPortfoliosService.generateMasterPortfolio(userId, projectId);
    }

    @Get(':projectId')
    @ApiOperation({
        summary: '마스터 포트폴리오 조회 API',
        description: '프로젝트의 마스터 포트폴리오를 조회합니다.',
    })
    @ApiParam({ name: 'projectId', type: Number, description: '프로젝트 ID' })
    @ApiCommonResponse(MasterPortfolioResponseDto)
    @ApiCommonErrorResponse(
        'MASTER_PORTFOLIO_NOT_FOUND',
        '마스터 포트폴리오를 찾을 수 없습니다.',
        404
    )
    async getMasterPortfolio(
        @Param('projectId', ParseIntPipe) projectId: number,
        @User('id') userId: number
    ) {
        return this.masterPortfoliosService.getMasterPortfolio(userId, projectId);
    }

    @Patch(':projectId')
    @ApiOperation({
        summary: '마스터 포트폴리오 업데이트 API',
        description: '프로젝트의 마스터 포트폴리오를 업데이트합니다.',
    })
    @ApiParam({ name: 'projectId', type: Number, description: '프로젝트 ID' })
    @ApiBody({ type: MasterPortfolioRequestDto })
    @ApiCommonResponse(MasterPortfolioResponseDto)
    @ApiCommonErrorResponse(
        'MASTER_PORTFOLIO_NOT_FOUND',
        '마스터 포트폴리오를 찾을 수 없습니다.',
        404
    )
    async updateMasterPortfolio(
        @Param('projectId', ParseIntPipe) projectId: number,
        @User('id') userId: number,
        @Body() updateDataDto: MasterPortfolioRequestDto
    ) {
        return this.masterPortfoliosService.updateMasterPortfolio(userId, projectId, updateDataDto);
    }

    @Get('/me')
    @ApiOperation({
        summary: '마이페이지/사용자 별 마스터포트폴리오 조회 API',
        description:
            '사용자의 마스터포트폴리오 리스트를 조회하는 API입니다. 페이징을 포함하며, 커서는 프로젝트 생성일자입니다.',
    })
    @ApiCommonResponseWithPagination(UserMasterPortfoliosResponseDto)
    async getUsersMasterPortfolios(
        @User('id') userId: number,
        @Query() req: Cursor //NOTE: 프로젝트 생성일자 기준(ISO 8301 형식)
    ): Promise<PaginatedResponseDto<UserMasterPortfoliosResponseDto> | null> {
        //파라미터의 기본값 처리
        const cursorDate = req.cursor ? new Date(req.cursor) : new Date(); //NOTE: 커서의 디폴트 값은 now
        const pageSize = Number(this.configService.get('PAGE_SIZE')) || 20;
        return await this.masterPortfoliosService.getMasterPortfoliosByUser(
            userId,
            cursorDate,
            pageSize
        );
    }
}
