import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import { DateCursor } from 'src/common/dtos/date-cursor.dto';
import { PaginatedResponseDto } from 'src/common/response/paginated-response.dto';
import { UserFinalPortfoliosResponseDto } from './dtos/user-final-portfolios-response';
import { FinalPortfoliosService } from './final-portfoilos.service';
import { ApiCommonResponseWithPagination } from 'src/common/response/swagger-response.helper';

@ApiTags('FinalPortfolios')
@ApiBearerAuth('access-token')
@Controller('/final-portfolios')
export class FinalPortfoliosController {
    constructor(
        private readonly configService: ConfigService,
        private readonly finalPortfoliosService: FinalPortfoliosService
    ) {}

    @Get('/me')
    @ApiOperation({
        summary: '마이페이지/사용자 별 AI 첨삭 조회 API',
        description:
            '사용자의 AI 첨삭 리스트를 조회하는 API입니다. 페이징을 포함하며, 커서는 AI 첨삭 생성일자입니다.',
    })
    @ApiCommonResponseWithPagination(UserFinalPortfoliosResponseDto)
    async getUsersFinalPortfolios(
        @Query(new ValidationPipe({ transform: true })) req: DateCursor,
        @User('id') userId: number
    ): Promise<PaginatedResponseDto<UserFinalPortfoliosResponseDto>> {
        //파라미터의 기본값 처리
        const cursorDate = req.cursor ? new Date(req.cursor) : new Date(); //NOTE: 커서의 디폴트 값은 now
        const pageSize = Number(this.configService.get('PAGE_SIZE')) || 20;
        return await this.finalPortfoliosService.getFinalProtfoliosByUser(
            userId,
            cursorDate,
            pageSize
        );
    }
}
