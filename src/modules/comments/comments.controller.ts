import { Controller, Param, Delete, Patch, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOkResponse, ApiOperation, ApiBody } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import { CommentsService } from './comments.service';
import { ApiCommonResponse } from 'src/common/response/swagger-response.helper';
import { UpdateCommentResponseDto, UpdateCommentRequestDto } from './dto/update-comment.dto';
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
}
