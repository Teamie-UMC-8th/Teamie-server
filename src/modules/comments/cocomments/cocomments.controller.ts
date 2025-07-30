import { Controller, Param, Delete, Patch, Body, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOkResponse, ApiOperation, ApiBody } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import { CocommentsService } from './cocomments.service';
import { ApiCommonResponse } from 'src/common/response/swagger-response.helper';
import { UpdateCocommentResponseDto, UpdateCocommentRequestDto } from './dto/update-cocomment.dto';
import { Transactional } from 'src/common/decorators/transaction.decorator';
import { CommonResponse } from 'src/common/response/common-response.dto';
import { TransactionalRequest } from 'src/common/decorators/transaction.decorator';

@ApiTags('Cocomments')
@ApiBearerAuth('access-token')
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
        @Param('cocommentId') cocommentId: number,
        @Body() dto: UpdateCocommentRequestDto,
        @User('id') userId: number,
        @Req() req: TransactionalRequest
    ) {
        return await this.cocommentsService.updateComment(
            userId,
            cocommentId,
            dto,
            req.queryRunner
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
        @Param('cocommentId') cocommentId: number,
        @User('id') userId: number,
        @Req() req: TransactionalRequest
    ): Promise<CommonResponse> {
        return this.cocommentsService.deleteCocomment(userId, cocommentId, req.queryRunner);
    }
}
