import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Cocomment } from './entities/cocomments.entity';
import { CocommentsController } from './cocomments.controller';
import { CocommentsService } from './services/cocomments.service';
@Module({
    imports: [TypeOrmModule.forFeature([Cocomment]), ConfigModule],
    controllers: [CocommentsController],
    providers: [CocommentsService],
})
export class CocommentsModule {}
