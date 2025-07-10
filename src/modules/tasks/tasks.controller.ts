import { Body, Controller, Post, Param, Req, UseGuards, Patch, Delete, Get} from '@nestjs/common';
import { Request } from 'express';
import { TasksService } from './tasks.service';
import { CreateTaskRequestDto } from './dtos/create-task.dto';
import { ConfigService } from '@nestjs/config';
import { ApiBody } from '@nestjs/swagger';
import { ApiCommonResponse, ApiCommonErrorResponse } from '../../common/response/swagger-responce.helper';
import { UpdateTaskRequestDto , UpdateTaskResponseDto} from './dtos/update-task.dto';
//import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('/tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService,
      private readonly configService: ConfigService) {}

  @Post()
  //@UseGuards(JwtAuthGuard)
  async createTask(@Req() req: Request, @Body() dto: CreateTaskRequestDto) {
    const userId = this.configService.get('DEFAULT_USERID');
    return await this.tasksService.createTask(userId, dto);
  } 

  @Patch('/:taskId')
  @ApiBody({ type: UpdateTaskRequestDto })
  @ApiCommonResponse(UpdateTaskResponseDto)
  async updateTask(
    @Param('taskId') taskId: number,
    @Req() req: Request, 
    @Body() dto: UpdateTaskRequestDto) {
	  const userId = this.configService.get('DEFAULT_USERID'); //하드코딩
	  return await this.tasksService.updateTask(dto, userId, taskId);
}
}
