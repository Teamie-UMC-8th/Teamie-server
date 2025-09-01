import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import {
    ApiCommonErrorResponse,
    ApiCommonResponse,
} from 'src/common/response/swagger-response.helper';
import { PlanDetails } from './dtos/plan-details.dto';
import { PlansService } from './services/plans.service';
import { Transactional, TransactionalRequest } from 'src/common/decorators/transaction.decorator';
import { DeletePlanResponseDto } from './dtos/delete-plan.dto';
import { BasicUpdatePlanReqDTO, UpdatePlanUserReqDTO } from './dtos/update-plan.dto';
import { ErrorCode } from 'src/common/exceptions/errorcode.enum';
import { ApiCommonErrorResponses } from 'src/common/decorators/api-common-error-responses.decorator';
import { PlanMemberGuard } from './guards/plan-member.guard';

@ApiTags('Plans')
@Controller('/plans')
export class PlansController {
    constructor(private readonly plansService: PlansService) {}

    @ApiOperation({
        summary: '일정 상세 페이지 조회',
        description: 'planId에 해당하는 일정 상세 페이지를 조회하는 API입니다.',
    })
    @ApiCommonResponse(PlanDetails)
    @ApiCommonErrorResponse(
        ErrorCode.PLAN_NOT_FOUND,
        'PLAN을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND
    )
    @UseGuards(PlanMemberGuard)
    @Get('/:planId')
    async getDetails(@Param('planId', ParseIntPipe) planId: number): Promise<PlanDetails> {
        return this.plansService.getDetails(planId);
    }

    @ApiOperation({
        summary: '일정 삭제',
        description: 'planId에 해당하는 일정을 삭제하는 API입니다.',
    })
    @ApiCommonResponse(DeletePlanResponseDto)
    @ApiCommonErrorResponse(
        ErrorCode.PLAN_NOT_FOUND,
        'PLAN을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND
    )
    @ApiCommonErrorResponse(
        ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
        '해당 프로젝트에 접근 권한이 없습니다.',
        HttpStatus.FORBIDDEN
    )
    @UseGuards(PlanMemberGuard)
    @Transactional()
    @Delete('/:planId')
    async deletePlan(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('planId', ParseIntPipe) planId: number
    ): Promise<DeletePlanResponseDto> {
        return await this.plansService.deletePlan(req.queryRunner, userId, planId);
    }

    @ApiOperation({
        summary: '일정 수정',
        description:
            'planId에 해당하는 일정의 참여자/기록자 리스트를 제외한 필드를 수정하는 API입니다.',
    })
    @ApiCommonResponse(PlanDetails)
    @ApiCommonErrorResponse(
        ErrorCode.PLAN_NOT_FOUND,
        'PLAN을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND
    )
    @ApiCommonErrorResponse(
        ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
        '해당 프로젝트에 접근 권한이 없습니다.',
        HttpStatus.FORBIDDEN
    )
    @UseGuards(PlanMemberGuard)
    @Transactional()
    @Patch('/:planId')
    async updatePlan(
        @Req() req: TransactionalRequest,
        @Param('planId', ParseIntPipe) planId: number,
        @Body() body: BasicUpdatePlanReqDTO
    ): Promise<PlanDetails> {
        return await this.plansService.updatePlan(req.queryRunner, planId, body);
    }

    @ApiOperation({
        summary: '일정의 참여자/기록자 수정',
        description: 'planId에 해당하는 일정의 참여자/기록자 리스트를 수정하는 API입니다.',
    })
    @ApiCommonResponse(PlanDetails)
    @ApiCommonErrorResponse(
        ErrorCode.PLAN_NOT_FOUND,
        'PLAN을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND
    )
    @ApiCommonErrorResponse(
        ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
        '해당 프로젝트에 접근 권한이 없습니다.',
        HttpStatus.FORBIDDEN
    )
    @ApiCommonErrorResponses(HttpStatus.BAD_REQUEST, [
        {
            errorCode: 'COMMON400',
            reason: '잘못된 REQUEST입니다.',
            data: '유효하지 않은 사용자 ID가 포함되어 있습니다.',
        },
        {
            errorCode: 'COMMON400',
            reason: '잘못된 REQUEST입니다.',
            data: '프로젝트에 참여하지 않은 사용자 ID가 포함되어 있습니다.',
        },
    ])
    @UseGuards(PlanMemberGuard)
    @Transactional()
    @Patch('/:planId/members')
    async updatePlanUserList(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('planId', ParseIntPipe) planId: number,
        @Body() body: UpdatePlanUserReqDTO
    ): Promise<PlanDetails> {
        return await this.plansService.updatePlanMembers(req.queryRunner, userId, planId, body);
    }
}
