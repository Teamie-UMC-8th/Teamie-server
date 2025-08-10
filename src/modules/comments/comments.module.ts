import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Comment } from './entities/comments.entity';
import { CommentsController } from './comments.controller';
import { CommentsService } from './services/comments.service';
import { Cocomment } from './cocomments/entities/cocomments.entity';
import { CommentRepository } from './repositories/comments.repository';
import { CocommentsModule } from './cocomments/cocomments.module';

@Module({
    imports: [TypeOrmModule.forFeature([Comment, Cocomment]), ConfigModule, CocommentsModule],
    controllers: [CommentsController],
    providers: [CommentsService, CommentRepository],
    exports: [CommentRepository, CommentsService], 
})
export class CommentsModule {}
