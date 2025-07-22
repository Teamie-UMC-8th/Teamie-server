import {
    Body,
    Controller,
    Post,
    Param,
    Req,
    Get,
    Patch,
    Delete,
    UploadedFiles,
    UseInterceptors,
    Query,
} from '@nestjs/common';
import { Request } from 'express';
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
import { FilesInterceptor } from '@nestjs/platform-express';
import { GetTaskResponseDto } from './dtos/get-task.dto';
import { TaskDashboardStepViewDto } from './dtos/task-dashboard-step-view-dto';
import { TaskDashboardStatusViewDto } from './dtos/task-dashboard-status-view-dto';
import {
    CreateCommentResponseDto,
    CreateCommentRequestDto,
} from '../comments/dto/create-comment.dto';
@ApiTags('Tasks')
@ApiBearerAuth('access-token')
@Controller('/tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    @ApiOperation({
        summary: '업수 생성',
        description: '새로운 업무를 생성합니다.',
    })
    @Post()
    async createTask(@Body() dto: CreateTaskRequestDto, @User('id') userId: number) {
        return await this.tasksService.createTask(userId, dto);
    }

    @Patch('/:taskId')
    @UseInterceptors(FilesInterceptor('files'))
    @ApiOperation({
        summary: '업무 수정',
        description: '기존 업무를 수정합니다.',
    })
    @ApiBody({ type: UpdateTaskRequestDto })
    @ApiCommonResponse(UpdateTaskResponseDto)
    async updateTask(
        @Param('taskId') taskId: number,
        @UploadedFiles() files: Express.Multer.File[],
        @Body() dto: UpdateTaskRequestDto,
        @User('id') userId: number
    ) {
        dto.files = files;

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
}
