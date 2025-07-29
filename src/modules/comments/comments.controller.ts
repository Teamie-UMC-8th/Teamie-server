import { Controller, Param, Delete, Patch, Body, Req, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOkResponse, ApiOperation, ApiBody } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import { CommentsService } from './comments.service';
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
@ApiBearerAuth('access-token')
@Controller('/comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @Patch('/:commentId')
    @ApiOperation({
        summary: '댓글 수정',
        description: '댓글 수정합니다.',
    })
    @ApiBody({ type: UpdateCommentRequestDto })
    @ApiCommonResponse(UpdateCommentResponseDto)
    async updateComment(
        @Param('commentId') commentId: number,
        @Body() dto: UpdateCommentRequestDto,
        @User('id') userId: number
    ) {
        return await this.commentsService.updateComment(userId, commentId, dto);
    }

    @Transactional()
    @Delete('/:commentId')
    @ApiOperation({
        summary: '댓글 삭제',
        description: '댓글을 삭제합니다.',
    })
    @ApiOkResponse({ type: String, description: '댓글 삭제 성공' })
    async deleteComment(
        @Param('commentId') commentId: number,
        @User('id') userId: number,
        @Req() req: TransactionalRequest
    ): Promise<CommonResponse> {
        return this.commentsService.deleteComment(userId, commentId, req.queryRunner);
    }

    @Transactional()
    @Post('/:commentId')
    @ApiOperation({
        summary: '대댓글 생성',
        description: '대댓글을 생성합니다.',
    })
    @ApiCommonResponse(CreateCocommentResponseDto)
    async createCocoment(
        @Param('commentId') commentId: number,
        @User('id') userId: number,
        @Req() req: TransactionalRequest,
        @Body() dto: CreateCocommentRequestDto
    ): Promise<CreateCocommentResponseDto> {
        return this.commentsService.createCocomment(userId, commentId, dto, req.queryRunner);
    }
}
