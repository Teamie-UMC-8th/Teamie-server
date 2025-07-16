import { Module } from '@nestjs/common';
import { PersonalRecallsService } from './personal-recalls.service';
import { PersonalRecallsController } from './personal-recalls.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonalRecall } from './entities/personal-recalls.entity';

@Module({
    imports: [TypeOrmModule.forFeature([PersonalRecall]), ConfigModule],
    controllers: [PersonalRecallsController],
    providers: [PersonalRecallsService],
})
export class PersonalRecallsModule {}
