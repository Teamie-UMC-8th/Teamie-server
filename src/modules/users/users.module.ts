import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './services/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { UploadModule } from 'src/infra/upload/upload.module';
import { MasterPortfoliosModule } from '../master-portfolios/master-portfolios.module';
import { UserProject } from '../projects/entities/userProjects.entity';
@Module({
    imports: [TypeOrmModule.forFeature([User, UserProject]), UploadModule, MasterPortfoliosModule],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
