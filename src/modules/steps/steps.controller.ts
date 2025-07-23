import { Controller, Body, ParseIntPipe, Patch, Param } from '@nestjs/common';
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
    @ApiCommonErrorResponse('STEP_NOT_FOUND', '해당 Step을 찾을 수 없습니다.')
    @ApiCommonErrorResponse('UNAUTHORIZED_USER', '인증되지 않은 사용자입니다.')
    async updateStep(
        @Param('stepId', ParseIntPipe) stepId: number,
        @Body() dto: UpdateStepDto,
        @User() userId: number
    ): Promise<CommonResponse<UpdateStepDto>> {
        return this.stepsService.updateStep(stepId, dto, userId);
    }
}
