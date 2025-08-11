import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './services/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { UploadModule } from 'src/infra/upload/upload.module';
import { MasterPortfoliosModule } from '../master-portfolios/master-portfolios.module';
import { UserRepository } from './repositories/user.repository';
import { UserProjectModule } from '../projects/user-projects/user-project.module';
import { UserProject } from '../projects/user-projects/entities/user-projects.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, UserProject]),
        UploadModule,
        MasterPortfoliosModule,
        UserProjectModule,
    ],
    controllers: [UsersController],
    providers: [UsersService, UserRepository],
    exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
