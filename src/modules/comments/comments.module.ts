import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comments.entity';
import { CommentsController } from './comments.controller';
import { CommentsService } from './services/comments.service';
import { CommentRepository } from './repositories/comments.repository';
import { CocommentsModule } from './cocomments/cocomments.module';
import { CommentsListener } from './listener/comments.listener';
import { GateWayModule } from 'src/infra/gateway/gateway.module';
@Module({
    imports: [TypeOrmModule.forFeature([Comment]), CocommentsModule, GateWayModule],
    controllers: [CommentsController],
    providers: [CommentsService, CommentRepository, CommentsListener],
    exports: [CommentRepository, CommentsService],
})
export class CommentsModule {}
