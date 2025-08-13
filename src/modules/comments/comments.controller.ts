import { Controller, Param, Delete, Patch, Body, Req, Post } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import { CommentsService } from './services/comments.service';
import {
    ApiCommonResponse,
    ApiCommonErrorResponse,
} from 'src/common/response/swagger-response.helper';
import { UpdateCommentResponseDto, UpdateCommentRequestDto } from './dto/update-comment.dto';
import { Transactional } from 'src/common/decorators/transaction.decorator';
import { CommonResponse } from 'src/common/response/common-response.dto';
import { TransactionalRequest } from 'src/common/decorators/transaction.decorator';
import {
    CreateCocommentResponseDto,
    CreateCocommentRequestDto,
} from './cocomments/dto/create-cocomment.dto';
import { ErrorCode } from '../../common/exceptions/errorcode.enum';
import { HttpStatus } from '@nestjs/common';

@ApiTags('Comments')
@Controller('/comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @ApiOperation({
        summary: '댓글 수정',
        description: '댓글 수정합니다.',
    })
    @ApiCommonResponse(UpdateCommentResponseDto)
    @ApiCommonErrorResponse(
        ErrorCode.COMMENT_NOT_FOUND,
        '댓글을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND
    )
    @ApiCommonErrorResponse(
        ErrorCode.FORBIDDEN_COMMENT_FOR_UPDATE,
        '해당 항목을 수정할 권한이 없습니다.',
        HttpStatus.FORBIDDEN
    )
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
    @ApiCommonErrorResponse(
        ErrorCode.COMMENT_NOT_FOUND,
        '댓글을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND
    )
    @ApiCommonErrorResponse(
        ErrorCode.FORBIDDEN_COMMENT_FOR_DELETE,
        '본인이 작성한 댓글만 삭제할 수 있습니다.',
        HttpStatus.FORBIDDEN
    )
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
    @ApiCommonResponse(CreateCocommentResponseDto)
    @ApiCommonErrorResponse(
        ErrorCode.COMMENT_NOT_FOUND,
        '댓글을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND
    )
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
