import {
    Body,
    Controller,
    Get,
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
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import { UsersService } from './services/users.service';
import {
    UpdateProfileRequestDto,
    UpdateProfileRequestWithFileDto,
    UserProfileResponseDto,
} from './dtos/user-profile.dto';
import {
    ApiCommonResponse,
    ApiCommonResponseWithPagination,
} from 'src/common/response/swagger-response.helper';
import { Transactional, TransactionalRequest } from 'src/common/decorators/transaction.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserMainTaskRequestDTO } from './dtos/user-main-task.dto';
import { UserMasterPortfoliosResponseDto } from '../master-portfolios/dtos/user-master-portfolios-response.dto';
import { UserProjectResponseDto } from './dtos/user-project.dto';
import { ProjectDashBoardDTO } from '../tasks/dtos/user-task.dto';
import { DateCursor } from 'src/common/dtos/date-cursor.dto';
import { PaginatedResponseDto } from 'src/common/response/paginated-response.dto';
import { TasksService } from '../tasks/services/tasks.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(
        private readonly userService: UsersService,
        private readonly tasksService: TasksService
    ) {}

    @ApiOperation({
        summary: '마이페이지/사용자 프로필 조회 API',
        description: '사용자의 프로필을 조회하는 API입니다.',
    })
    @ApiCommonResponse(UserProfileResponseDto)
    @Get('/me')
    async getUserProfile(@User('id') userId: number) {
        return await this.userService.getUserProfile(userId);
    }

    @ApiOperation({
        summary: '마이페이지/사용자 프로필 수정 API',
        description: '사용자의 프로필(프로필 이미지, 학교, 전공)을 수정하는 API입니다.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UpdateProfileRequestWithFileDto })
    @ApiCommonResponse(UserProfileResponseDto)
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
        summary: '마이페이지/주요업무 수정 API',
        description: '사용자의 프로젝트 별 주요업무 필드를 수정하는 API입니다.',
    })
    @ApiCommonResponse(UserMasterPortfoliosResponseDto)
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

    @ApiOperation({
        summary: '나의 프로젝트 조회',
        description: '사용자가 속한 프로젝트의 id,이름,프로젝트 내 역할을 반환하는 API입니다.',
    })
    @ApiCommonResponse(UserProjectResponseDto)
    @Get('/me/projects')
    async getUserProject(@User('id') userId: number) {
        return await this.userService.getUserProject(userId);
    }

    @ApiOperation({
        summary: '나의 업무 조회 API',
        description:
            '홈 > 나의 업무 페이지의 업무 대시보드를 조회하는 API입니다. 페이징을 포함하며, 커서는 프로젝트의 생성일자를 기준으로 합니다.',
    })
    @ApiCommonResponseWithPagination(ProjectDashBoardDTO)
    @Get('/me/tasks')
    async getUserTask(
        @User('id') userId: number,
        @Query(new ValidationPipe({ transform: true })) query?: DateCursor
    ): Promise<PaginatedResponseDto<ProjectDashBoardDTO>> {
        return await this.tasksService.getTaskByUser(userId, query?.cursor);
    }
}
