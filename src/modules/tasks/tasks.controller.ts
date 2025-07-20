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
    Query
} from '@nestjs/common';
import { Request } from 'express';
import { TasksService } from './tasks.service';
import { CreateTaskRequestDto } from './dtos/create-task.dto';
import { ApiBearerAuth, ApiBody, ApiTags, ApiQuery, ApiOkResponse, getSchemaPath, ApiExtraModels } from '@nestjs/swagger';
import { ApiCommonResponse } from '../../common/response/swagger-response.helper';
import { UpdateTaskRequestDto, UpdateTaskResponseDto } from './dtos/update-task.dto';
import { User } from 'src/common/decorators/user.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GetTaskResponseDto } from './dtos/get-task.dto';
import { TaskDashboardStepViewDto } from './dtos/task-dashboard-step-view-dto';
import { TaskDashboardStatusViewDto } from './dtos/task-dashboard-status-view-dto';

@ApiTags('Tasks')
@ApiBearerAuth('access-token')
@Controller('/tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    @Post()
    async createTask(
        @Req() req: Request,
        @Body() dto: CreateTaskRequestDto,
        @User('id') userId: number
    ) {
        return await this.tasksService.createTask(userId, dto);
    }

    @Patch('/:taskId')
    @UseInterceptors(FilesInterceptor('files'))
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
    @ApiCommonResponse(UpdateTaskResponseDto)
    async deleteTask(@Param('taskId') taskId: number, @User('id') userId: number) {
        return await this.tasksService.deleteTask(userId, taskId);
    }

    @Get('/:taskId')
    @ApiCommonResponse(GetTaskResponseDto)
    async getTask(@Param('taskId') taskId: number, @User('id') userId: number) {
        return await this.tasksService.getTask(userId, taskId);
    }

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
    @Param('projectId') projectId: number,
    @User('id') userId: number,
    @Query('view') view: string,
    ): Promise<TaskDashboardStepViewDto | TaskDashboardStatusViewDto> {
    return this.tasksService.getTaskDashBoard(userId, projectId, view);
    }
}
