import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './tasks.entity';
import { Step } from '../steps/steps.entity';
import { UserProject } from '../mappings/userProjects/userProjects.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Step, UserProject]),
          ConfigModule,],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}