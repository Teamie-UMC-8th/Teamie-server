import { Body, Controller, Post, Param, Req, Patch} from '@nestjs/common';
import { Request } from 'express';
import { TasksService } from './tasks.service';
import { CreateTaskRequestDto } from './dtos/create-task.dto';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ApiCommonResponse} from '../../common/response/swagger-responce.helper';
import { UpdateTaskRequestDto , UpdateTaskResponseDto} from './dtos/update-task.dto';
import { User } from 'src/common/decorators/user.decorator';

@ApiTags('Tasks')
@ApiBearerAuth('access-token')
@Controller('/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async createTask(
    @Req() req: Request,
    @Body() dto: CreateTaskRequestDto,
    @User('id') userId: number,
  ) {
    return await this.tasksService.createTask(userId, dto);
  } 

  @Patch('/:taskId')
  @ApiBody({ type: UpdateTaskRequestDto })
  @ApiCommonResponse(UpdateTaskResponseDto)
  async updateTask(
    @Param('taskId') taskId: number,
    @Req() req: Request, 
    @Body() dto: UpdateTaskRequestDto,
    @User('id') userId: number,
  ) {
	  return await this.tasksService.updateTask(dto, userId, taskId);
  }

  @Delete('/:taskId')
  @ApiCommonResponse(UpdateTaskResponseDto)
  async deleteTask(
    @Param('taskId') taskId: number) {
	  const userId = this.configService.get('DEFAULT_USERID'); //하드코딩
	  return await this.tasksService.deleteTask(userId, taskId);
  }

}
