import {
    Body,
    Controller,
    Post,
    Param,
    Get,
    Patch,
    Delete,
    UploadedFile,
    UseInterceptors,
    Query,
    Req,
    ValidationPipe,
    ParseIntPipe,
} from '@nestjs/common';
import { TasksService } from './services/tasks.service';
import { CreateTaskRequestDto, CreateTaskResponseDto } from './dtos/create-task.dto';
import {
    ApiBody,
    ApiTags,
    ApiQuery,
    ApiOkResponse,
    ApiOperation,
    getSchemaPath,
    ApiExtraModels,
    ApiConsumes,
    ApiBadRequestResponse,
} from '@nestjs/swagger';
import {
    ApiCommonResponse,
    ApiCommonResponseWithPagination,
    ApiCommonErrorResponse,
} from '../../common/response/swagger-response.helper';
import { UpdateTaskRequestDto, UpdateTaskResponseDto } from './dtos/update-task.dto';
import { User } from 'src/common/decorators/user.decorator';
import { ApiCommonErrorResponses } from 'src/common/decorators/api-common-error-responses.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetTaskResponseDto } from './dtos/get-task.dto';
import { TaskDashboardStepViewDto } from './dtos/task-dashboard-step-view-dto';
import { TaskDashboardStatusViewDto } from './dtos/task-dashboard-status-view-dto';
import {
    CreateCommentResponseDto,
    CreateCommentRequestDto,
} from '../comments/dto/create-comment.dto';
import { Status } from '../../common/enums/status.enum';
import { Transactional } from 'src/common/decorators/transaction.decorator';
import { TransactionalRequest } from 'src/common/decorators/transaction.decorator';
import { CreateTaskFileResponseDto } from '../mappings/task-files/dtos/create-task-files.dto';
import { DeleteTaskResponseDto } from './dtos/delete-task.dto';
import { GetCommentResponseDto } from '../comments/dto/get-comment.dto';
import { ProjectDashBoardDTO } from './dtos/user-task.dto';
import { PaginatedResponseDto } from 'src/common/response/paginated-response.dto';
import { DateCursor } from 'src/common/dtos/date-cursor.dto';
import { GetSearchTaskDto } from './dtos/get-search-task.dto';
import { ErrorCode } from '../../common/exceptions/errorcode.enum';
import { HttpStatus } from '@nestjs/common';
import { UpdateTaskStatusResponseDto, UpdateTaskStatusRequestDto } from './dtos/update-task-status.dto';

@ApiTags('Tasks')
@Controller('/tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    @ApiOperation({
        summary: '업무 생성',
        description: '새로운 업무를 생성합니다.',
    })
    @ApiCommonResponse(CreateTaskResponseDto)
    @ApiCommonErrorResponse(
        ErrorCode.STEP_NOT_FOUND,
        'STEP을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND
    )
    @ApiCommonErrorResponse(
        ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
        '해당 프로젝트에 접근 권한이 없습니다.',
        HttpStatus.FORBIDDEN
    )
    @Transactional()
    @Post()
    async createTask(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Body() dto: CreateTaskRequestDto
    ) {
        return await this.tasksService.createTask(req.queryRunner, userId, dto);
    }

    @ApiOperation({
        summary: '나의 업무 조회 API',
        description:
            '홈 > 나의 업무 페이지의 업무 대시보드를 조회하는 API입니다. 페이징을 포함하며, 커서는 프로젝트의 생성일자를 기준으로 합니다.',
    })
    @ApiCommonResponseWithPagination(ProjectDashBoardDTO)
    @Get('/my-task')
    async getUserTask(
        @User('id') userId: number,
        @Query(new ValidationPipe({ transform: true })) query?: DateCursor
    ): Promise<PaginatedResponseDto<ProjectDashBoardDTO>> {
        return await this.tasksService.getTaskByUser(userId, query?.cursor);
    }

    @ApiOperation({
        summary: '업무 수정',
        description: '기존 업무를 수정합니다.',
    })
    @ApiCommonResponse(UpdateTaskResponseDto)
    @ApiCommonErrorResponse(
        ErrorCode.TASK_NOT_FOUND,
        'TASK를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND
    )
    @ApiCommonErrorResponse(
        ErrorCode.STEP_NOT_FOUND,
        'STEP을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND
    )
    @ApiCommonErrorResponse(
        ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
        '해당 프로젝트에 접근 권한이 없습니다.',
        HttpStatus.FORBIDDEN
    )
    @ApiCommonErrorResponse(
        ErrorCode.BAD_REQUEST,
        '유효하지 않은 사용자 ID가 포함되어 있습니다.',
        HttpStatus.BAD_REQUEST
    )
    @ApiCommonErrorResponse(
        ErrorCode.BAD_REQUEST,
        '프로젝트에 참여하지 않은 사용자 ID가 포함되어 있습니다.',
        HttpStatus.BAD_REQUEST
    )
    @ApiCommonErrorResponses(HttpStatus.BAD_REQUEST, [
        {
            errorCode: 'COMMON400',
            reason: '유효하지 않은 사용자 ID가 포함되어 있습니다.',
        },
        {
            errorCode: 'COMMON400',
            reason: '프로젝트에 참여하지 않은 사용자 ID가 포함되어 있습니다.',
        },
    ])
    @Transactional()
    @Patch('/:taskId')
    async updateTask(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('taskId') taskId: number,
        @Body() dto: UpdateTaskRequestDto
    ) {
        return await this.tasksService.updateTask(req.queryRunner, userId, taskId, dto);
    }

    @ApiOperation({
        summary: '업무 삭제',
        description: '업무를 삭제합니다.',
    })
    @ApiCommonResponse(DeleteTaskResponseDto)
    @ApiCommonErrorResponse(
        ErrorCode.TASK_NOT_FOUND,
        'TASK를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND
    )
    @ApiCommonErrorResponse(
        ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
        '해당 프로젝트에 접근 권한이 없습니다.',
        HttpStatus.FORBIDDEN
    )
    @Transactional()
    @Delete('/:taskId')
    async deleteTask(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('taskId') taskId: number
    ) {
        return await this.tasksService.deleteTask(req.queryRunner, userId, taskId);
    }

    @ApiOperation({
        summary: '업무 상세 조회',
        description: '업무를 상세히 조회합니다.',
    })
    @ApiCommonResponse(GetTaskResponseDto)
    @ApiCommonErrorResponse(
        ErrorCode.TASK_NOT_FOUND,
        'TASK를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND
    )
    @ApiCommonErrorResponse(
        ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
        '해당 프로젝트에 접근 권한이 없습니다.',
        HttpStatus.FORBIDDEN
    )
    @Get('/:taskId')
    async getTask(@User('id') userId: number, @Param('taskId') taskId: number) {
        return await this.tasksService.getTask(userId, taskId);
    }

    @ApiOperation({
        summary: '업무 대시보드',
        description: '프로젝트 별 업무 대시보드입니다.',
    })
    @ApiExtraModels(TaskDashboardStepViewDto, TaskDashboardStatusViewDto)
    @ApiQuery({
        name: 'view',
        required: false,
        description: '조회 방식: step 또는 status',
    })
    @ApiOkResponse({
        description: '단계별 또는 상태별로 업무를 그룹화한 대시보드 응답',
        schema: {
            oneOf: [
                { $ref: getSchemaPath(TaskDashboardStepViewDto) },
                { $ref: getSchemaPath(TaskDashboardStatusViewDto) },
            ],
        },
    })
    @ApiCommonErrorResponse(
        ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
        '해당 프로젝트에 접근 권한이 없습니다.',
        HttpStatus.FORBIDDEN
    )
    @ApiCommonErrorResponse(
        ErrorCode.PROJECT_NOT_FOUND,
        '프로젝트를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND
    )
    @ApiCommonErrorResponses(HttpStatus.BAD_REQUEST, {
        errorCode: 'COMMON400',
        reason: `'view' 파라미터는 'step' 또는 'status'만 허용됩니다.`,
    })
    @Get('/:projectId/dashboard')
    async getTaskDashboard(
        @User('id') userId: number,
        @Param('projectId') projectId: number,
        @Query('view') view: string
    ): Promise<TaskDashboardStepViewDto | TaskDashboardStatusViewDto> {
        return this.tasksService.getTaskDashBoard(userId, projectId, view);
    }

    @ApiOperation({
        summary: '댓글 추가',
        description: '업무 상세페이지에서 댓글을 추가합니다.',
    })
    @ApiCommonResponse(CreateCommentResponseDto)
    @ApiCommonErrorResponse(
        ErrorCode.TASK_NOT_FOUND,
        'TASK를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND
    )
    @ApiCommonErrorResponse(
        ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
        '해당 프로젝트에 접근 권한이 없습니다.',
        HttpStatus.FORBIDDEN
    )
    @Transactional()
    @Post('/:taskId/comments')
    async createComment(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('taskId') taskId: number,
        @Body() dto: CreateCommentRequestDto
    ): Promise<CreateCommentResponseDto> {
        return await this.tasksService.createComment(req.queryRunner, userId, taskId, dto);
    }

    @ApiOperation({
        summary: '업무 파일 추가',
        description: '업무 상세페이지에서 파일을 추가합니다.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: '업로드할 파일',
                },
            },
        },
    })
    @ApiCommonErrorResponse(
        ErrorCode.TASK_NOT_FOUND,
        'TASK를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND
    )
    @ApiCommonErrorResponse(
        ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
        '해당 프로젝트에 접근 권한이 없습니다.',
        HttpStatus.FORBIDDEN
    )
    @ApiCommonResponse(CreateTaskFileResponseDto)
    @UseInterceptors(FileInterceptor('file'))
    @Transactional()
    @Post('/:taskId/task-files')
    async createTaskFile(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('taskId') taskId: number,
        @UploadedFile() file: Express.Multer.File
    ): Promise<CreateTaskFileResponseDto> {
        return await this.tasksService.createTaskFile(req.queryRunner, userId, taskId, file);
    }

    @ApiOperation({
        summary: 'step별 업무 더보기',
        description: 'step별로 더보기 버튼을 누르면 5개씩 추가로 보여줍니다.',
    })
    @ApiCommonResponse(GetTaskResponseDto)
    @ApiCommonErrorResponses(HttpStatus.BAD_REQUEST, {
        errorCode: 'COMMON400',
        reason: 'offset은 0 이상이어야 합니다.',
    })
    @Get('/:projectId/dashboard/step/:stepId/more')
    async getStepMore(
        @Param('projectId') projectId: number,
        @Param('stepId') stepId: number,
        @Query('offset') offset: number
    ) {
        return this.tasksService.getMoreTasksByStep(projectId, stepId, offset);
    }

    @ApiOperation({
        summary: '진행상황별 업무 더보기',
        description: '진행상황별로 더보기 버튼을 누르면 5개씩 추가로 보여줍니다.',
    })
    @ApiCommonResponse(GetTaskResponseDto)
    @ApiCommonErrorResponses(HttpStatus.BAD_REQUEST, [
        {
            errorCode: 'COMMON400',
            reason: 'offset은 0 이상이어야 합니다.',
        },
        {
            errorCode: 'COMMON400',
            reason: 'status는 NOTSTART, ONGOING, COMPLETED 중 하나여야 합니다.',
        },
    ])
    @Get('/:projectId/dashboard/status/:status/more')
    async getStatusMore(
        @Param('projectId') projectId: number,
        @Param('status') status: Status,
        @Query('offset') offset: number
    ) {
        return this.tasksService.getMoreTasksByStatus(projectId, status, offset);
    }

    @ApiOperation({
        summary: '업무별 댓글 조회',
        description: '업무별로 댓글과 대댓글을 조회합니다',
    })
    @ApiCommonResponse(GetCommentResponseDto)
    @ApiCommonErrorResponses(HttpStatus.BAD_REQUEST, {
        errorCode: 'COMMON400',
        reason: 'offset은 0 이상이어야 합니다.',
    })
    @Get('/:taskId/comments')
    async getComment(@Param('taskId') taskId: number, @Query('offset') offset: number) {
        return this.tasksService.getComment(taskId, offset);
    }

    @ApiOperation({
        summary: '업무 검색',
        description: '검색 필터로 업무를 검색합니다',
    })
    @ApiExtraModels(TaskDashboardStepViewDto, TaskDashboardStatusViewDto)
    @ApiQuery({
        name: 'view',
        required: false,
        description: '조회 방식: step 또는 status',
    })
    @ApiOkResponse({
        description: '단계별 또는 상태별로 업무를 그룹화한 대시보드 응답',
        schema: {
            oneOf: [
                { $ref: getSchemaPath(TaskDashboardStepViewDto) },
                { $ref: getSchemaPath(TaskDashboardStatusViewDto) },
            ],
        },
    })
    @ApiCommonErrorResponse(
        ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
        '해당 프로젝트에 접근 권한이 없습니다.',
        HttpStatus.FORBIDDEN
    )
    @Get('/:projectId/search')
    async getSearchTask(
        @User('id') userId: number,
        @Param('projectId', ParseIntPipe) projectId: number,
        @Query('view') view: string,
        @Query() dto: GetSearchTaskDto
    ) {
        return this.tasksService.getSearchTask(userId, projectId, view, dto);
    }

    @ApiOperation({
        summary: 'step별 검색한 업무 더보기',
        description: 'step별로 더보기 버튼을 누르면 5개씩 추가로 보여줍니다.',
    })
    @ApiCommonResponse(GetTaskResponseDto)
    @ApiCommonErrorResponse(
        ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
        '해당 프로젝트에 접근 권한이 없습니다.',
        HttpStatus.FORBIDDEN
    )
    @Get('/:projectId/search/step/:stepId/more')
    async getSearchStepMore(
        @User('id') userId: number,
        @Param('projectId') projectId: number,
        @Param('stepId') stepId: number,
        @Query('offset') offset: number,
        @Query(new ValidationPipe({ transform: true })) dto: GetSearchTaskDto
    ) {
        return this.tasksService.getSearchMoreTasksByStep(userId, projectId, stepId, offset, dto);
    }

    @ApiOperation({
        summary: '진행상황별 검색한 업무 더보기',
        description: '진행상황별로 더보기 버튼을 누르면 5개씩 추가로 보여줍니다.',
    })
    @ApiCommonResponse(GetTaskResponseDto)
    @ApiCommonErrorResponse(
        ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
        '해당 프로젝트에 접근 권한이 없습니다.',
        HttpStatus.FORBIDDEN
    )
    @Get('/:projectId/search/status/:status/more')
    async getSearchStatusMore(
        @User('id') userId: number,
        @Param('projectId') projectId: number,
        @Param('status') status: Status,
        @Query('offset') offset: number,
        @Query(new ValidationPipe({ transform: true })) dto: GetSearchTaskDto
    ) {
        return this.tasksService.getSearchMoreTasksByStatus(userId, projectId, status, offset, dto);
    }

    @ApiOperation({
        summary: '업무 상태 변경',
        description: '업무의 상태 변경하기',
    })
    @ApiCommonResponse(UpdateTaskStatusResponseDto)
    @ApiCommonErrorResponse(
        ErrorCode.TASK_NOT_FOUND,
        'TASK를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND
    )
    @ApiCommonErrorResponse(
        ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
        '해당 프로젝트에 접근 권한이 없습니다.',
        HttpStatus.FORBIDDEN
    )
    @ApiCommonErrorResponses(HttpStatus.BAD_REQUEST, {
        errorCode: 'COMMON400',
        reason: 'status는 NOTSTART, ONGOING, COMPLETED 중 하나여야 합니다.',
    })
    @Transactional()
    @Patch('/:taskId/status')
    async updateTaskStatus(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('taskId') taskId: number,
        @Body() dto: UpdateTaskStatusRequestDto
    ) {
        return this.tasksService.updateTaskStatus(req.queryRunner, userId, taskId, dto);
    }
}
