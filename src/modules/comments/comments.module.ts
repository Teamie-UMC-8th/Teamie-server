import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Comment } from './comments.entity';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
@Module({
    imports: [TypeOrmModule.forFeature([Comment]), ConfigModule],
    controllers: [CommentsController],
    providers: [CommentsService],
})
export class CommentsModule {}
