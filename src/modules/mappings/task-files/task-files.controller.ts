import { Controller, Param, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import { TaskFilesService } from './task-files.service';
@ApiTags('Tasks')
@ApiBearerAuth('access-token')
@Controller('/task-files')
export class TaskFilesController {
    constructor(private readonly taskFilesService: TaskFilesService) {}

    @Delete('/:taskFileId')
    @ApiOperation({
        summary: '업무 파일 삭제',
        description: '업무의 파일을 삭제합니다.',
    })
    @ApiOkResponse({
        schema: {
            example: {
                message: '업무 파일이 삭제되었습니다.',
            },
        },
    })
    async deleteTaskFile(
        @Param('taskFileId') fileId: number,
        @User('id') userId: number
    ): Promise<{ message: string }> {
        await this.taskFilesService.deleteTaskFile(fileId, userId);
        return { message: '업무 파일이 삭제되었습니다.' };
    }
}
