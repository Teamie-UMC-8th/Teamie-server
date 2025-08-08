import { Controller, Param, Delete, Patch, Body, Req, Post } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiOperation, ApiBody } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import { CommentsService } from './services/comments.service';
import { ApiCommonResponse } from 'src/common/response/swagger-response.helper';
import { UpdateCommentResponseDto, UpdateCommentRequestDto } from './dto/update-comment.dto';
import { Transactional } from 'src/common/decorators/transaction.decorator';
import { CommonResponse } from 'src/common/response/common-response.dto';
import { TransactionalRequest } from 'src/common/decorators/transaction.decorator';
import {
    CreateCocommentResponseDto,
    CreateCocommentRequestDto,
} from './cocomments/dto/create-cocomment.dto';

@ApiTags('Comments')
@Controller('/comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @ApiOperation({
        summary: '댓글 수정',
        description: '댓글 수정합니다.',
    })
    @ApiBody({ type: UpdateCommentRequestDto })
    @ApiCommonResponse(UpdateCommentResponseDto)
    @Transactional()
    @Patch('/:commentId')
    async updateComment(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('commentId') commentId: number,
        @Body() dto: UpdateCommentRequestDto
    ) {
        return await this.commentsService.updateComment(req.queryRunner, userId, commentId, dto);
    }

    @ApiOperation({
        summary: '댓글 삭제',
        description: '댓글을 삭제합니다.',
    })
    @ApiOkResponse({ type: String, description: '댓글 삭제 성공' })
    @Transactional()
    @Delete('/:commentId')
    async deleteComment(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('commentId') commentId: number
    ): Promise<CommonResponse> {
        return this.commentsService.deleteComment(req.queryRunner, userId, commentId);
    }

    @ApiOperation({
        summary: '대댓글 생성',
        description: '대댓글을 생성합니다.',
    })
    @ApiBody({ type: CreateCocommentRequestDto })
    @ApiCommonResponse(CreateCocommentResponseDto)
    @Transactional()
    @Post('/:commentId/cocomments')
    async createCocoment(
        @Param('commentId') commentId: number,
        @User('id') userId: number,
        @Req() req: TransactionalRequest,
        @Body() dto: CreateCocommentRequestDto
    ): Promise<CreateCocommentResponseDto> {
        return this.commentsService.createCocomment(req.queryRunner, userId, commentId, dto);
    }
}
