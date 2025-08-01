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
import { Cocomment } from './cocomments/cocomments.entity';
import {
    CreateCocommentRequestDto,
    CreateCocommentResponseDto,
} from './cocomments/dto/create-cocomment.dto';

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,

        @InjectRepository(Cocomment)
        private readonly cocommentRepository: Repository<Cocomment>
    ) {}

    async updateComment(
        queryRunner: QueryRunner,
        userId: number,
        commentId: number,
        dto: UpdateCommentRequestDto
    ): Promise<UpdateCommentResponseDto> {
        // 1. 댓글 존재 여부 확인 (작성자 정보까지 조회)
        const comment = await queryRunner.manager
            .createQueryBuilder(Comment, 'comment')
            .leftJoin('comment.user', 'user')
            .addSelect(['user.id'])
            .where('comment.id = :commentId', { commentId })
            .select(['comment.id', 'comment.content', 'user.id'])
            .getOne();

        if (!comment) {
            throw new CommentNotFoundException('댓글을 찾을 수 없습니다.');
        }

        // 2. 작성자 확인 (권한 체크)
        if (userId !== comment.user.id) {
            throw new CommentUpdateForbiddenException('본인이 작성한 댓글만 수정할 수 있습니다.');
        }

        // 3. 댓글 내용 수정
        comment.content = dto.content;

        // 4. 댓글 저장 (QueryRunner 사용)
        const updatedComment = await queryRunner.manager.save(Comment, comment);

        // 5. DTO 변환 후 반환
        return UpdateCommentResponseDto.from(updatedComment);
    }

    async deleteComment(
        queryRunner: QueryRunner,
        userId: number,
        commentId: number
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

    async createCocomment(
        queryRunner: QueryRunner,
        userId: number,
        commentId: number,
        dto: CreateCocommentRequestDto
    ): Promise<CreateCocommentResponseDto> {
        // 1. 대댓글 작성할 댓글 있는지
        const comment = await queryRunner.manager
            .createQueryBuilder(Comment, 'comment')
            .where('comment.id = :commentId', { commentId })
            .getOne();

        if (!comment) throw new CommentNotFoundException();

        // 2. 댓글 생성 및 저장
        const cocomment = queryRunner.manager.create(Cocomment, {
            user: { id: userId },
            comment: { id: commentId },
            content: dto.content,
        });
        const saved = await queryRunner.manager.save(Cocomment, cocomment);

        // 3. 응답 반환
        return CreateCocommentResponseDto.from(saved);
    }
}
