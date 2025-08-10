import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './services/projects.service';
import { Project } from './entities/projects.entity';
import { UserProject } from './entities/userProjects.entity';
import { RedisModule } from '../../infra/redis/redis.module';
import { PersonalRecallsModule } from '../personal-recalls/personal-recalls.module';
import { PersonalRecall } from '../personal-recalls/entities/personal-recalls.entity';
import { StepsModule } from '../steps/steps.module';
import { Step } from '../steps/entities/steps.entity';
import { MasterPortfolio } from '../master-portfolios/entities/master-portfolios.entity';
import { MasterPortfoliosModule } from '../master-portfolios/master-portfolios.module';
import { User } from '../users/entities/users.entity';
import { PlansModule } from '../plans/plans.module';
import { TasksModule } from '../tasks/tasks.module';
import { ProjectRepository } from './repositories/project.repository';
import { UserProjectRepository } from './repositories/user-project.repository';
import { InviteCodeStore } from './repositories/invite-code.store';
import { PostsStore } from './repositories/posts.store';
@Module({
    imports: [
        TypeOrmModule.forFeature([Project, UserProject, PersonalRecall, Step, User]),
        RedisModule,
        PersonalRecallsModule,
        forwardRef(() => StepsModule), // Circular dependency handling
        MasterPortfoliosModule,
        forwardRef(() => PlansModule),
        forwardRef(() => TasksModule),
    ],
    controllers: [ProjectsController],
    providers: [
        ProjectsService,
        ProjectRepository,
        UserProjectRepository,
        InviteCodeStore,
        PostsStore,
    ],
    exports: [ProjectsService], // 다른 모듈에서 사용 가능하게 할 경우
})
export class ProjectsModule {}
