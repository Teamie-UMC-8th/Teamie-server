import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Query,
    Req,
    UploadedFile,
    UseInterceptors,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import { UsersService } from './services/users.service';
import {
    UpdateProfileRequestDto,
    UpdateProfileRequestWithFileDto,
    UserProfileResponseDto,
} from './dtos/user-profile.dto';
import {
    ApiCommonErrorResponse,
    ApiCommonResponse,
    ApiCommonResponseWithPagination,
} from 'src/common/response/swagger-response.helper';
import { Transactional, TransactionalRequest } from 'src/common/decorators/transaction.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserMainTaskRequestDTO } from './dtos/user-main-task.dto';
import { UserMasterPortfoliosResponseDto } from '../master-portfolios/dtos/user-master-portfolios-response.dto';
import { UserProjectResponseDto } from './dtos/user-project.dto';
import { ProjectDashBoardDTO, TaskCardDTO } from '../tasks/dtos/user-task.dto';
import { DateCursor } from 'src/common/dtos/date-cursor.dto';
import { PaginatedResponseDto } from 'src/common/response/paginated-response.dto';
import { TasksService } from '../tasks/services/tasks.service';
import { ErrorCode } from 'src/common/exceptions/errorcode.enum';
import {
    hasNextPageExampleOfMyCorrections,
    hasNextPageExampleOfMyPortfolios,
    hasNextPageExampleOfMyTasks,
    hasNextPageExampleOfMyTasksMore,
    lastPageExampleOfMyCorrections,
    lastPageExampleOfMyPortfolios,
    lastPageExampleOfMyTasks,
    lastPageExampleOfMyTasksMore,
} from 'src/config/swagger-examples';
import { ConfigService } from '@nestjs/config';
import { MasterPortfoliosService } from '../master-portfolios/services/master-portfolios.service';
import { UserPortfolioCorrectionResponseDto } from '../portfolio-corrections/dtos/user-portfolio-correction-response.dto';
import { PortfolioCorrectionsService } from '../portfolio-corrections/services/portfolio-corrections.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(
        private readonly configService: ConfigService,
        private readonly userService: UsersService,
        private readonly tasksService: TasksService,
        private readonly masterPortfoliosService: MasterPortfoliosService,
        private readonly portfolioCorrectionsService: PortfolioCorrectionsService
    ) {}

    @ApiOperation({
        summary: '마이페이지/사용자 프로필 조회',
        description: '사용자의 프로필을 조회하는 API입니다.',
    })
    @ApiCommonResponse(UserProfileResponseDto)
    @ApiCommonErrorResponse(
        ErrorCode.UNAUTHORIZED,
        '유효하지 않은 사용자입니다.',
        HttpStatus.UNAUTHORIZED
    )
    @Get('/me')
    async getUserProfile(@User('id') userId: number) {
        return await this.userService.getUserProfile(userId);
    }

    @ApiOperation({
        summary: '마이페이지/사용자 프로필 수정',
        description: '사용자의 프로필(프로필 이미지, 학교, 전공)을 수정하는 API입니다.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UpdateProfileRequestWithFileDto })
    @ApiCommonResponse(UserProfileResponseDto)
    @ApiCommonErrorResponse(ErrorCode.BAD_REQUEST, '잘못된 REQUEST입니다.', HttpStatus.BAD_REQUEST)
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    @UseInterceptors(FileInterceptor('file'))
    @Transactional()
    @Patch('/me')
    async updateUserProfile(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Body() body?: UpdateProfileRequestDto,
        @UploadedFile() file?: Express.Multer.File
    ) {
        return await this.userService.updateUserProfile(req.queryRunner, userId, body, file);
    }

    @ApiOperation({
        summary: '나의 프로젝트 조회',
        description:
            '사용자가 속한 프로젝트의 id, 이름, 프로젝트 내 역할을 반환하는 API입니다. 완료되지 않은 프로젝트만을 반환합니다.',
    })
    @ApiCommonResponse(UserProjectResponseDto)
    @Get('/me/projects')
    async getUserProject(@User('id') userId: number): Promise<UserProjectResponseDto[]> {
        return await this.userService.getUserProject(userId);
    }

    @ApiOperation({
        summary: '나의 업무 조회',
        description:
            '홈 > 나의 업무 페이지의 업무 대시보드를 조회하는 API입니다. 페이징을 포함하며, 커서는 프로젝트의 생성일자를 기준으로 합니다.',
    })
    @ApiCommonResponseWithPagination(
        ProjectDashBoardDTO,
        hasNextPageExampleOfMyTasks,
        lastPageExampleOfMyTasks
    )
    @Get('/me/tasks')
    async getUserTask(
        @User('id') userId: number,
        @Query(new ValidationPipe({ transform: true })) query?: DateCursor
    ): Promise<PaginatedResponseDto<ProjectDashBoardDTO>> {
        return await this.tasksService.getTaskByUser(userId, query?.cursor);
    }

    @ApiOperation({
        summary: '나의 업무 조회/더보기',
        description:
            '홈 > 나의 업무 페이지의 업무 대시보드를 프로젝트 기준으로 필터링하여 업무를 추가 조회하는 API입니다. 커서는 1) 업무의 마감일, 2) 업무의 생성일을 기준으로 하는 복합커서입니다. 커서가 없는 경우 초기 더보기로 조회되는 업무 이후의 maxCardNum만큼의 업무를 조회합니다.',
    })
    @ApiQuery({ name: 'projectId', type: Number, required: true })
    @ApiQuery({ name: 'cursor', type: String, required: false })
    @Get('/me/tasks/more')
    async getMoreUserTasksPerProject(
        @User('id') userId: number,
        @Query('projectId', ParseIntPipe) projectId: number,
        @Query('cursor') cursor?: string
    ): Promise<PaginatedResponseDto<TaskCardDTO>> {
        return await this.tasksService.getTasksMoreByUser(userId, projectId, cursor);
    }

    @ApiOperation({
        summary: '마이페이지/사용자 별 마스터포트폴리오 조회',
        description:
            '사용자의 마스터포트폴리오 리스트를 조회하는 API입니다. 페이징을 포함하며, 커서는 프로젝트 생성일자입니다.',
    })
    @ApiCommonResponseWithPagination(
        UserMasterPortfoliosResponseDto,
        hasNextPageExampleOfMyPortfolios,
        lastPageExampleOfMyPortfolios
    )
    @Get('/me/master-portfolios')
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
        summary: '마이페이지/사용자 별 AI 첨삭 조회',
        description:
            '사용자의 AI 첨삭 리스트를 조회하는 API입니다. 페이징을 포함하며, 커서는 AI 첨삭 생성일자입니다.',
    })
    @ApiCommonResponseWithPagination(
        UserPortfolioCorrectionResponseDto,
        hasNextPageExampleOfMyCorrections,
        lastPageExampleOfMyCorrections
    )
    @Get('/me/portfolio-corrections')
    async getUsersPortfolioCorrections(
        @User('id') userId: number,
        @Query(new ValidationPipe({ transform: true })) req: DateCursor
    ): Promise<PaginatedResponseDto<UserPortfolioCorrectionResponseDto>> {
        //파라미터의 기본값 처리
        const cursorDate = req.cursor ? new Date(req.cursor) : new Date(); //NOTE: 커서의 디폴트 값은 now
        const pageSize = Number(this.configService.get('PAGE_SIZE')) || 20;
        return await this.portfolioCorrectionsService.getPortfolioCorrectionsByUser(
            userId,
            cursorDate,
            pageSize
        );
    }

    @ApiOperation({
        summary: '마이페이지/주요업무 수정',
        description: '사용자의 프로젝트 별 주요업무 필드를 수정하는 API입니다.',
    })
    @ApiCommonResponse(UserMasterPortfoliosResponseDto)
    @ApiCommonErrorResponse(
        ErrorCode.FORBIDDEN_USER_FOR_MASTER_PORTFOLIO,
        '마스터포트폴리오 카드에 대해 수정권한이 없는 사용자입니다.',
        HttpStatus.FORBIDDEN
    )
    @ApiCommonErrorResponse(
        ErrorCode.MASTER_PORTFOLIO_NOT_FOUND,
        '마스터 포트폴리오를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND
    )
    @Transactional()
    @Patch('/me/:portfolioId')
    async updateMainTask(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('portfolioId', ParseIntPipe) portfolioId: number,
        @Body() body: UserMainTaskRequestDTO
    ) {
        return await this.userService.updateMainTaskField(
            req.queryRunner,
            userId,
            portfolioId,
            body
        );
    }
}
