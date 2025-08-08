import { Controller, Body, ParseIntPipe, Patch, Delete, Param } from '@nestjs/common';
import { StepsService } from './services/steps.service';
import { ApiBody, ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import {
    ApiCommonResponse,
    ApiCommonErrorResponse,
} from '../../common/response/swagger-response.helper';
import { CreateStepDto } from './dtos/create-step.dto';
import { User } from 'src/common/decorators/user.decorator';
import { CommonResponse } from 'src/common/response/common-response.dto';
import { UpdateStepDto, UpdateStepResponseDto } from './dtos/update-step.dto';
import { UpdateTaskStepDto, UpdateTaskStepResponseDto } from './dtos/update-task-step.dto';
import { Transactional } from 'src/common/decorators/transaction.decorator';
@ApiTags('Steps')
@Controller('/steps')
export class StepsController {
    constructor(private readonly stepsService: StepsService) {}
    @Patch('/:stepId')
    @Transactional()
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
    ): Promise<UpdateStepResponseDto> {
        return this.stepsService.updateStep(stepId, dto);
    }

    @Patch('/:stepId/:taskId')
    @Transactional()
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
    ): Promise<UpdateTaskStepResponseDto> {
        return this.stepsService.updateTaskStep(dto, stepId, taskId);
    }

    @Delete('/:stepId')
    @Transactional()
    @ApiOperation({
        summary: '스텝 삭제',
        description: 'step을 삭제합니다.',
    })
    @ApiOkResponse({ type: String, description: 'step 삭제 성공' })
    @ApiCommonErrorResponse('STEP_NOT_FOUND', 'STEP을 찾을 수 없습니다.', 404)
    @ApiCommonErrorResponse('UNAUTHORIZED_USER', '인증되지 않은 사용자입니다.', 403)
    @ApiCommonErrorResponse(
        'STEP_DELETE_FORBIDDEN',
        'STEP 내부에 업무가 존재할 경우, 삭제가 불가능합니다',
        403
    )
    async DeleteTaskResponseDto(
        @Param('stepId', ParseIntPipe) stepId: number,
        @User() userId: number
    ): Promise<CommonResponse> {
        return this.stepsService.deleteStep(stepId);
    }
}
