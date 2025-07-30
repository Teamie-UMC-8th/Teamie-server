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
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskRequestDto, CreateTaskResponseDto } from './dtos/create-task.dto';
import {
    ApiBearerAuth,
    ApiBody,
    ApiTags,
    ApiQuery,
    ApiOkResponse,
    ApiOperation,
    getSchemaPath,
    ApiExtraModels,
    ApiConsumes,
} from '@nestjs/swagger';
import { ApiCommonResponse } from '../../common/response/swagger-response.helper';
import { UpdateTaskRequestDto, UpdateTaskResponseDto } from './dtos/update-task.dto';
import { User } from 'src/common/decorators/user.decorator';
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

@ApiTags('Tasks')
@ApiBearerAuth('access-token')
@Controller('/tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    @ApiOperation({
        summary: '업무 생성',
        description: '새로운 업무를 생성합니다.',
    })
    @ApiBody({ type: CreateTaskRequestDto })
    @ApiCommonResponse(CreateTaskResponseDto)
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
        summary: '업무 수정',
        description: '기존 업무를 수정합니다.',
    })
    @ApiBody({ type: UpdateTaskRequestDto })
    @ApiCommonResponse(UpdateTaskResponseDto)
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
    @ApiBody({ type: CreateCommentRequestDto })
    @ApiCommonResponse(CreateCommentResponseDto)
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
    @Get('/:projectId/dashboard/step/:stepId/more')
    async getStepMore(
        @Param('projectId') projectId: number,
        @Param('stepId') stepId: number,
        @Query('offset') offset: number,
        @Query('limit') limit = 5
    ) {
        return this.tasksService.getMoreTasksByStep(projectId, stepId, offset, limit);
    }

    @ApiOperation({
        summary: '진행상황별 업무 더보기',
        description: '진행상황별로 더보기 버튼을 누르면 5개씩 추가로 보여줍니다.',
    })
    @ApiCommonResponse(GetTaskResponseDto)
    @Get('/:projectId/dashboard/status/:status/more')
    async getStatusMore(
        @Param('projectId') projectId: number,
        @Param('status') status: Status,
        @Query('offset') offset: number,
        @Query('limit') limit = 5
    ) {
        return this.tasksService.getMoreTasksByStatus(projectId, status, offset, limit);
    }

    @ApiOperation({
        summary: '업무별 댓글 조회',
        description: '업무별로 댓글과 대댓글을 조회합니다',
    })
    @ApiCommonResponse(GetCommentResponseDto)
    @Get('/:taskId/comments')
    async getComment(
        @Param('taskId') taskId: number, 
        @Query('offset') offset: number
    ) {
        return this.tasksService.getComment(taskId, offset);
    }
}

