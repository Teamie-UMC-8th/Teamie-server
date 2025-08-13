import { Controller, Param, Delete, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import { TaskFilesService } from './task-files.service';
import { ErrorCode } from '../../../common/exceptions/errorcode.enum';
import { HttpStatus } from '@nestjs/common';
import { ApiCommonErrorResponse } from 'src/common/response/swagger-response.helper';

import { Transactional } from 'src/common/decorators/transaction.decorator';
import { TransactionalRequest } from 'src/common/decorators/transaction.decorator';
import { CommonResponse } from 'src/common/response/common-response.dto';

@ApiTags('Tasks')
@ApiBearerAuth('access-token')
@Controller('/task-files')
export class TaskFilesController {
    constructor(private readonly taskFilesService: TaskFilesService) {}

    @ApiOperation({
        summary: '업무 파일 삭제',
        description: '업무의 파일을 삭제합니다.',
    })
    @ApiOkResponse({ type: String, description: '업무 파일 삭제 성공' })
    @ApiCommonErrorResponse(
        ErrorCode.TASK_FILE_NOT_FOUND,
        '업무파일을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND
    )
    @Transactional()
    @Delete('/:taskFileId')
    async deleteTaskFile(
        @Req() req: TransactionalRequest,
        @Param('taskFileId') fileId: number
    ): Promise<CommonResponse> {
        return this.taskFilesService.deleteTaskFile(req.queryRunner, fileId);
    }
}
