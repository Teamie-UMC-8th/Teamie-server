import { Body, Controller, Post, Req, UseGuards, Patch, Delete, Get} from '@nestjs/common';
import { Request } from 'express';
import { TasksService } from './tasks.service';
import { CreateTaskRequestDto } from './dtos/create-task.dto';
import { ConfigService } from '@nestjs/config';
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
}
