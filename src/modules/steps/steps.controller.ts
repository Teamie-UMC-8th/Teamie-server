import { Controller, Body, ParseIntPipe, Patch, Delete, Param, Req } from '@nestjs/common';
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
import { TransactionalRequest } from 'src/common/decorators/transaction.decorator';
import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from 'src/common/exceptions/errorcode.enum';
@ApiTags('Steps')
@Controller('/steps')
export class StepsController {
    constructor(private readonly stepsService: StepsService) {}

    @ApiOperation({
        summary: 'step 수정',
        description: 'step의 이름을 수정합니다.',
    })
    @ApiCommonResponse(UpdateStepResponseDto)
    @ApiCommonErrorResponse(ErrorCode.STEP_NOT_FOUND, '해당 Step을 찾을 수 없습니다.', HttpStatus.FORBIDDEN)
    @ApiCommonErrorResponse(ErrorCode.UNAUTHORIZED, '인증되지 않은 사용자입니다.', HttpStatus.FORBIDDEN)
    @Transactional()
    @Patch('/:stepId')
    async updateStep(
        @Req() req: TransactionalRequest,
        @User() userId: number,
        @Param('stepId', ParseIntPipe) stepId: number,
        @Body() dto: UpdateStepDto,
    ): Promise<UpdateStepResponseDto> {
        return this.stepsService.updateStep(req.queryRunner, stepId, dto);
    }

    @ApiOperation({
        summary: '업무의 step 수정',
        description: '업무의 step을 수정합니다',
    })
    @ApiCommonResponse(UpdateTaskStepResponseDto)
    @ApiCommonErrorResponse(ErrorCode.STEP_NOT_FOUND, 'STEP을 찾을 수 없습니다.', HttpStatus.FORBIDDEN)
    @ApiCommonErrorResponse(ErrorCode.TASK_NOT_FOUND, 'TASK를 찾을 수 없습니다.', HttpStatus.FORBIDDEN)
    @ApiCommonErrorResponse(ErrorCode.UNAUTHORIZED, '인증되지 않은 사용자입니다.', HttpStatus.FORBIDDEN)
    @Transactional()
    @Patch('/:stepId/:taskId')
    async updateTaskStep(
        @Req() req: TransactionalRequest,
        @User() userId: number,
        @Param('stepId', ParseIntPipe) stepId: number,
        @Param('taskId', ParseIntPipe) taskId: number,
        @Body() dto: UpdateTaskStepDto,
    ): Promise<UpdateTaskStepResponseDto> {
        return this.stepsService.updateTaskStep(req.queryRunner, dto, stepId, taskId);
    }

    @ApiOperation({
        summary: '스텝 삭제',
        description: 'step을 삭제합니다.',
    })
    @ApiOkResponse({ type: String, description: 'step 삭제 성공' })
    @ApiCommonErrorResponse(ErrorCode.STEP_NOT_FOUND, 'STEP을 찾을 수 없습니다.', HttpStatus.FORBIDDEN)
    @ApiCommonErrorResponse(ErrorCode.UNAUTHORIZED, '인증되지 않은 사용자입니다.', HttpStatus.FORBIDDEN)
    @ApiCommonErrorResponse(
        ErrorCode.STEP_DELETE_FORBIDDEN,
        'STEP 내부에 업무가 존재할 경우, 삭제가 불가능합니다',
        HttpStatus.FORBIDDEN
    )
    @Transactional()
    @Delete('/:stepId')
    async DeleteTaskResponseDto(
        @Req() req: TransactionalRequest,
        @User() userId: number,
        @Param('stepId', ParseIntPipe) stepId: number,
    ): Promise<CommonResponse> {
        return this.stepsService.deleteStep(req.queryRunner, stepId);
    }
}
