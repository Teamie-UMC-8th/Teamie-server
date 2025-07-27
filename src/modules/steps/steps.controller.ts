import { Controller, Body, ParseIntPipe, Patch, Delete, Param } from '@nestjs/common';
import { StepsService } from './steps.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
    ApiCommonResponse,
    ApiCommonErrorResponse,
} from '../../common/response/swagger-response.helper';
import { CreateStepDto } from './dtos/create-step.dto';
import { User } from 'src/common/decorators/user.decorator';
import { CommonResponse } from 'src/common/response/common-response.dto';
import { UpdateStepDto, UpdateStepResponseDto } from './dtos/update-step.dto';
import { UpdateTaskStepDto, UpdateTaskStepResponseDto } from './dtos/update-task-step.dto';
@ApiTags('Steps')
@ApiBearerAuth('access-token')
@Controller('/steps')
export class StepsController {
    constructor(private readonly stepsService: StepsService) {}
    @Patch('/:stepId')
    @ApiOperation({
        summary: 'step 수정',
        description: 'step의 이름을 수정합니다.',
    })
    @ApiBody({ type: UpdateStepDto })
    @ApiCommonResponse(UpdateStepResponseDto)
    @ApiCommonErrorResponse('STEP_NOT_FOUND', '해당 Step을 찾을 수 없습니다.', 404)
    @ApiCommonErrorResponse('UNAUTHORIZED_USER', '인증되지 않은 사용자입니다.', 403)
    async updateStep(
        @Param('stepId', ParseIntPipe) stepId: number,
        @Body() dto: UpdateStepDto,
        @User() userId: number
    ): Promise<CommonResponse<UpdateStepResponseDto>> {
        return this.stepsService.updateStep(stepId, dto);
    }

    @Patch('/:stepId/:taskId')
    @ApiOperation({
        summary: '업무의 step 수정',
        description: '업무의 step을 수정합니다',
    })
    @ApiBody({ type: UpdateTaskStepDto })
    @ApiCommonResponse(UpdateTaskStepResponseDto)
    @ApiCommonErrorResponse('STEP_NOT_FOUND', 'STEP을 찾을 수 없습니다.', 404)
    @ApiCommonErrorResponse('TASK_NOT_FOUND', 'TASK를 찾을 수 없습니다.', 404)
    @ApiCommonErrorResponse('UNAUTHORIZED_USER', '인증되지 않은 사용자입니다.', 403)
    async updateTaskStep(
        @Param('stepId', ParseIntPipe) stepId: number,
        @Param('taskId', ParseIntPipe) taskId: number,
        @Body() dto: UpdateTaskStepDto,
        @User() userId: number
    ): Promise<CommonResponse<UpdateTaskStepResponseDto>> {
        return this.stepsService.updateTaskStep(dto, stepId, taskId);
    }

    @Delete('/:stepId')
    @ApiOperation({
        summary: '스텝 삭제',
        description: '업무의 step을 수정합니다.',
    })
    async DeleteTaskResponseDto(
        @Param('stepId', ParseIntPipe) stepId: number,
        @User() userId: number
    ): Promise<CommonResponse> {
        return this.stepsService.deleteStep(stepId);
    }
}
