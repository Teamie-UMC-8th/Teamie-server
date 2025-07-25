import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Comment } from './comments.entity';
import { UpdateCommentResponseDto, UpdateCommentRequestDto } from './dto/update-comment.dto';
import {
    CommentUpdateForbiddenException,
    CommentNotFoundException,
} from 'src/common/exceptions/custom.errors';

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>
    ) {}

    async updateComment(userId: number, commentId: number, dto: UpdateCommentRequestDto) {
        const comment = await this.commentRepository
            .createQueryBuilder('comment')
            .leftJoin('comment.user', 'user')
            .addSelect(['user.id'])
            .where('comment.id = :commentId', { commentId })
            .select(['comment.content', 'user.id'])
            .getOne();
        if (!comment) {
            throw new CommentNotFoundException('댓글을 찾을 수 없습니다.');
        }

        if (userId != comment.user.id) {
            throw new CommentUpdateForbiddenException('본인이 작성한 댓글만 수정할 수 있습니다.');
        }

        comment.content = dto.content;

        const updatedComment = await this.commentRepository.save(comment);
        return UpdateCommentResponseDto.from(updatedComment);
    }
}
