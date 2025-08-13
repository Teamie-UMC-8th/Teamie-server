import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProject } from './entities/user-projects.entity';
import { UserProjectRepository } from './repositories/user-project.repository';

@Module({
    imports: [TypeOrmModule.forFeature([UserProject])],
    providers: [UserProjectRepository],
    exports: [UserProjectRepository],
})
export class UserProjectModule {}
