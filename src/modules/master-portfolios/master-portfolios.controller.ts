import { Controller, Param, ParseIntPipe, Post, Get, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { PaginatedResponseDto } from 'src/common/response/paginated-response.dto';
import {
    Cursor,
    UserMasterPortfoliosResponseDto,
} from './dtos/user-master-portfolios-response.dto';
import { MasterPortfoliosService } from './master-portfolios.service';
import { User } from 'src/common/decorators/user.decorator';
import { ApiCommonResponseWithPagination } from 'src/common/response/swagger-response.helper';

@ApiTags('MasterPortfolios')
@ApiBearerAuth('access-token')
@Controller('master-portfolios')
export class MasterPortfoliosController {
    constructor(
        private readonly configService: ConfigService,
        private readonly masterPortfoliosService: MasterPortfoliosService
    ) {}

    @Post(':projectId/questions')
    async createQuestions(
        @Param('projectId', ParseIntPipe) projectId: number,
        @User('id') userId: number
    ) {
        return this.masterPortfoliosService.createQuestions(userId, projectId);
    }

    @Post(':projectId/')
    async createMasterPortfolio(
        @Param('projectId', ParseIntPipe) projectId: number,
        @User('id') userId: number
    ) {
        return this.masterPortfoliosService.createMasterPortfolio(userId, projectId);
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
