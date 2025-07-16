import { Module } from '@nestjs/common';
import { PersonalRecallsService } from './personalRecalls.service';
import { PersonalRecallsController } from './personalRecalls.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonalRecall } from './entities/personalRecalls.entity';

@Module({
    imports: [TypeOrmModule.forFeature([PersonalRecall]), ConfigModule],
    controllers: [PersonalRecallsController],
    providers: [PersonalRecallsService],
})
export class PersonalRecallsModule {}
