import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Comment } from './entities/comments.entity';
import { CommentsController } from './comments.controller';
import { CommentsService } from './services/comments.service';
import { Cocomment } from './cocomments/entities/cocomments.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Comment, Cocomment]), ConfigModule],
    controllers: [CommentsController],
    providers: [CommentsService],
})
export class CommentsModule {}
