import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comments.entity';
import { CommentsController } from './comments.controller';
import { CommentsService } from './services/comments.service';
import { CommentRepository } from './repositories/comments.repository';
import { CocommentsModule } from './cocomments/cocomments.module';

@Module({
    imports: [TypeOrmModule.forFeature([Comment]), CocommentsModule],
    controllers: [CommentsController],
    providers: [CommentsService, CommentRepository],
    exports: [CommentRepository, CommentsService],
})
export class CommentsModule {}
