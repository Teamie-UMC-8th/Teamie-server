import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Comment } from './comments.entity';
import { UpdateCommentResponseDto, UpdateCommentRequestDto } from './dto/update-comment.dto';
import {
    CommentUpdateForbiddenException,
    CommentNotFoundException,
    CommentDeleteForbiddenException,
} from 'src/common/exceptions/custom.errors';
import { CommonResponse } from 'src/common/response/common-response.dto';
import { QueryRunner } from 'typeorm';

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

    async deleteComment(
        userId: number,
        commentId: number,
        queryRunner: QueryRunner
    ): Promise<CommonResponse> {
        // 댓글 존재 여부 확인
        const comment = await queryRunner.manager
            .createQueryBuilder(Comment, 'comment')
            .leftJoinAndSelect('comment.user', 'user')
            .where('comment.id = :commentId', { commentId })
            .getOne();

        if (!comment) {
            throw new CommentNotFoundException();
        }

        // 댓글 작성자와 로그인한 유저가 같은지 확인
        if (comment.user.id !== userId) {
            throw new CommentDeleteForbiddenException();
        }

        // 댓글 삭제
        await this.commentRepository.delete({ id: commentId });

        return CommonResponse.success({ message: `댓글 ID ${commentId} 삭제 완료` });
    }
}
