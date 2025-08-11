import { Injectable } from '@nestjs/common';
import { UpdateCommentResponseDto, UpdateCommentRequestDto } from '../dto/update-comment.dto';
import {
    CommentUpdateForbiddenException,
    CommentDeleteForbiddenException,
} from 'src/common/exceptions/custom.errors';
import { CommonResponse } from 'src/common/response/common-response.dto';
import { QueryRunner } from 'typeorm';
import { Cocomment } from '../cocomments/entities/cocomments.entity';
import {
    CreateCocommentRequestDto,
    CreateCocommentResponseDto,
} from '../cocomments/dto/create-cocomment.dto';
import { CommentRepository } from '../repositories/comments.repository';
import { CocommentRepository } from '../cocomments/repositories/cocoment.repository';
@Injectable()
export class CommentsService {
    constructor(
        private readonly commentRepository: CommentRepository,

        private readonly cocommentRepository: CocommentRepository
    ) {}

    async updateComment(
        queryRunner: QueryRunner,
        userId: number,
        commentId: number,
        dto: UpdateCommentRequestDto
    ): Promise<UpdateCommentResponseDto> {
        // 1. 댓글 존재 여부 확인 (작성자 정보까지 조회)
        const comment = await this.commentRepository.findByIdWithUserWithQueryRunner(
            queryRunner,
            commentId
        );

        // 2. 작성자 확인 (권한 체크)
        if (userId !== comment.user.id) {
            throw new CommentUpdateForbiddenException('본인이 작성한 댓글만 수정할 수 있습니다.');
        }

        // 3. 댓글 내용 수정
        comment.content = dto.content;

        // 4. 댓글 저장 (QueryRunner 사용)
        const updatedComment = await this.commentRepository.saveCommentWithQueryRunner(
            queryRunner,
            comment
        );

        // 5. DTO 변환 후 반환
        return UpdateCommentResponseDto.from(updatedComment);
    }

    async deleteComment(
        queryRunner: QueryRunner,
        userId: number,
        commentId: number
    ): Promise<CommonResponse> {
        // 댓글 존재 여부 확인
        const comment = await this.commentRepository.findByIdWithUserWithQueryRunner(
            queryRunner,
            commentId
        );

        // 댓글 작성자와 로그인한 유저가 같은지 확인
        if (comment.user.id !== userId) {
            throw new CommentDeleteForbiddenException();
        }

        // 댓글 삭제
        await this.commentRepository.deleteCommentWithQueryRunner(queryRunner, commentId);

        return CommonResponse.success({ message: `댓글 ID ${commentId} 삭제 완료` });
    }

    async createCocomment(
        queryRunner: QueryRunner,
        userId: number,
        commentId: number,
        dto: CreateCocommentRequestDto
    ): Promise<CreateCocommentResponseDto> {
        // 1. 대댓글 작성할 댓글 있는지
        const comment = await this.commentRepository.findCommentByIdWithQueryRunner(
            queryRunner,
            commentId
        );

        // 2. 댓글 생성
        const cocomment = queryRunner.manager.create(Cocomment, {
            user: { id: userId },
            comment: { id: commentId },
            content: dto.content,
        });

        // 3. 댓글 저장
        const saved = await this.cocommentRepository.saveCocommentWithQueryRunner(
            queryRunner,
            cocomment
        );

        // 4. 응답 반환
        return CreateCocommentResponseDto.from(saved);
    }
}
