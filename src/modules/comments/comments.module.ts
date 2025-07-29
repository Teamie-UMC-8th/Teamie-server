import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Comment } from './comments.entity';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { Cocomment } from './cocomments/cocomments.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Comment, Cocomment]), ConfigModule],
    controllers: [CommentsController],
    providers: [CommentsService],
})
export class CommentsModule {}
