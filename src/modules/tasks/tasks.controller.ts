import { Body, Controller, Post, Req, UseGuards, Patch, Delete, Get} from '@nestjs/common';
import { Request } from 'express';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dtos/create-request.dto';
import { ConfigService } from '@nestjs/config';
//import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('/tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService,
      private readonly configService: ConfigService) {}

  @Post()
  //@UseGuards(JwtAuthGuard)
  async createTask(@Req() req: Request, @Body() dto: CreateTaskDto) {
    const userId = this.configService.get('DEFAULT_USERID');
    return await this.tasksService.createTask(userId, dto);
  }

  @Patch()
  //@UseGuards(JwtAuthGuard)
  async updateTask(@Req() req: Request, @Body() dto: CreateTaskDto) {
    const userId = Number(process.env.DEFAULT_USERID); // 카카오 로그인 연동 전까지 하드코딩
    return {
      isSuccess: true,
      error: null,
      result: await this.tasksService.createTask(userId, dto),
    };
  }
    
}
