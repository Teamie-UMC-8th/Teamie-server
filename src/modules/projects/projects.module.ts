import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from './entities/projects.entity';
import { UserProject } from '../mappings/userProjects/userProjects.entity'; 
import { RedisModule } from '../../infra/redis/redis.module';
import { PersonalRecallsModule } from '../personalRecalls/personalRecalls.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, UserProject]),
    RedisModule,
    PersonalRecallsModule
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService], // 다른 모듈에서 사용 가능하게 할 경우
})
export class ProjectsModule {}