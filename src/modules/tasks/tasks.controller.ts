import {
    Body,
    Controller,
    Post,
    Param,
    Req,
    Patch,
    Delete,
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { TasksService } from './tasks.service';
import { CreateTaskRequestDto } from './dtos/create-task.dto';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ApiCommonResponse } from '../../common/response/swagger-response.helper';
import { UpdateTaskRequestDto, UpdateTaskResponseDto } from './dtos/update-task.dto';
import { User } from 'src/common/decorators/user.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';

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
}
