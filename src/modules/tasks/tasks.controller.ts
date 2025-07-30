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
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskRequestDto } from './dtos/create-task.dto';
import {
    ApiBearerAuth,
    ApiBody,
    ApiTags,
    ApiQuery,
    ApiOkResponse,
    ApiOperation,
    getSchemaPath,
    ApiExtraModels,
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
import { CreateTaskFileResponseDto } from '../mappings/task-files/dtos/create-task-files.dto';
@ApiTags('Tasks')
@ApiBearerAuth('access-token')
@Controller('/tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    @ApiOperation({
        summary: '업무 생성',
        description: '새로운 업무를 생성합니다.',
    })
    @Post()
    async createTask(@Body() dto: CreateTaskRequestDto, @User('id') userId: number) {
        return await this.tasksService.createTask(userId, dto);
    }

    @Patch('/:taskId')
    @ApiOperation({
        summary: '업무 수정',
        description: '기존 업무를 수정합니다.',
    })
    @ApiBody({ type: UpdateTaskRequestDto })
    @ApiCommonResponse(UpdateTaskResponseDto)
    async updateTask(
        @Param('taskId') taskId: number,
        @Body() dto: UpdateTaskRequestDto,
        @User('id') userId: number
    ) {
        return await this.tasksService.updateTask(dto, userId, taskId);
    }

    @Delete('/:taskId')
    @ApiOperation({
        summary: '업무 삭제',
        description: '업무를 삭제합니다.',
    })
    @ApiCommonResponse(UpdateTaskResponseDto)
    async deleteTask(@Param('taskId') taskId: number, @User('id') userId: number) {
        return await this.tasksService.deleteTask(userId, taskId);
    }

    @Get('/:taskId')
    @ApiOperation({
        summary: '업무 상세 조회',
        description: '업무를 상세히 조회합니다.',
    })
    @ApiCommonResponse(GetTaskResponseDto)
    async getTask(@Param('taskId') taskId: number, @User('id') userId: number) {
        return await this.tasksService.getTask(userId, taskId);
    }

    @Get('/:projectId/dashboard')
    @ApiExtraModels(TaskDashboardStepViewDto, TaskDashboardStatusViewDto)
    @ApiQuery({
        name: 'view',
        required: false,
        description: '조회 방식: step 또는 status',
    })
    @ApiOperation({
        summary: '업무 대시보드',
        description: '프로젝트 별 업무 대시보드입니다.',
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
    async getTaskDashboard(
        @Param('projectId') projectId: number,
        @User('id') userId: number,
        @Query('view') view: string
    ): Promise<TaskDashboardStepViewDto | TaskDashboardStatusViewDto> {
        return this.tasksService.getTaskDashBoard(userId, projectId, view);
    }

    @Post('/:taskId/comments')
    @ApiOperation({
        summary: '댓글 추가',
        description: '업무 상세페이지에서 댓글을 추가합니다.',
    })
    @ApiCommonResponse(CreateCommentResponseDto)
    async createComment(
        @Param('taskId') taskId: number,
        @User('id') userId: number,
        @Body() dto: CreateCommentRequestDto
    ): Promise<CreateCommentResponseDto> {
        return await this.tasksService.createComment(userId, taskId, dto);
    }

    @Post('/:taskId/task-files')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({
        summary: '업무 파일 추가',
        description: '업무 상세페이지에서 파일을 추가합니다.',
    })
    @ApiCommonResponse(CreateTaskFileResponseDto)
    async createTaskFile(
        @Param('taskId') taskId: number,
        @UploadedFile() file: Express.Multer.File,
        @User('id') userId: number
    ): Promise<CreateTaskFileResponseDto> {
        return await this.tasksService.createTaskFile(userId, taskId, file);
    }

    @Get('/:projectId/dashboard/step/:stepId/more')
    @ApiOperation({
        summary: 'step별 업무 더보기',
        description: 'step별로 더보기 버튼을 누르면 5개씩 추가로 보여줍니다.',
    })
    @ApiCommonResponse(GetTaskResponseDto)
    async getStepMore(
        @Param('projectId') projectId: number,
        @Param('stepId') stepId: number,
        @Query('offset') offset: number,
        @Query('limit') limit = 5
    ) {
        return this.tasksService.getMoreTasksByStep(projectId, stepId, offset, limit);
    }

    @Get('/:projectId/dashboard/status/:status/more')
    @ApiOperation({
        summary: '진행상황별 업무 더보기',
        description: '진행상황별로 더보기 버튼을 누르면 5개씩 추가로 보여줍니다.',
    })
    async getStatusMore(
        @Param('projectId') projectId: number,
        @Param('status') status: Status,
        @Query('offset') offset: number,
        @Query('limit') limit = 5
    ) {
        return this.tasksService.getMoreTasksByStatus(projectId, status, offset, limit);
    }

    @Get('/:taskId/comments')
    @ApiOperation({
        summary: '업무별 댓글 조회',
        description: '업무별로 댓글과 대댓글을 조회합니다',
    })
    async getComment(@Param('taskId') taskId: number, @Query('offset') offset: number) {
        return this.tasksService.getComment(taskId, offset);
    }
}
