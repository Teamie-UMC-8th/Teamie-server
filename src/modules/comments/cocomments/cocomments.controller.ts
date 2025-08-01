import { Controller, Param, Delete, Patch, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiOperation, ApiBody } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import { CocommentsService } from './cocomments.service';
import { ApiCommonResponse } from 'src/common/response/swagger-response.helper';
import { UpdateCocommentResponseDto, UpdateCocommentRequestDto } from './dto/update-cocomment.dto';
import { Transactional } from 'src/common/decorators/transaction.decorator';
import { CommonResponse } from 'src/common/response/common-response.dto';
import { TransactionalRequest } from 'src/common/decorators/transaction.decorator';

@ApiTags('Cocomments')
@Controller('/cocomments')
export class CocommentsController {
    constructor(private readonly cocommentsService: CocommentsService) {}

    @ApiOperation({
        summary: '대댓글 수정',
        description: '대댓글을 수정합니다.',
    })
    @ApiBody({ type: UpdateCocommentRequestDto })
    @ApiCommonResponse(UpdateCocommentResponseDto)
    @Transactional()
    @Patch('/:cocommentId')
    async updateComment(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('cocommentId') cocommentId: number,
        @Body() dto: UpdateCocommentRequestDto
    ) {
        return await this.cocommentsService.updateComment(
            req.queryRunner,
            userId,
            cocommentId,
            dto
        );
    }

    @ApiOperation({
        summary: '대댓글 삭제',
        description: '대댓글을 삭제합니다.',
    })
    @ApiOkResponse({ type: String, description: '대댓글 삭제 성공' })
    @Transactional()
    @Delete('/:cocommentId')
    async deleteCocomment(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('cocommentId') cocommentId: number
    ): Promise<CommonResponse> {
        return this.cocommentsService.deleteCocomment(req.queryRunner, userId, cocommentId);
    }
}
