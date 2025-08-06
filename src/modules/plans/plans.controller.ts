import {
    Body,
    Controller,
    Delete,
    Get,
    NotImplementedException,
    Param,
    ParseIntPipe,
    Patch,
    Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import {
    ApiCommonErrorResponse,
    ApiCommonResponse,
} from 'src/common/response/swagger-response.helper';
import { PlanDetails } from './dtos/plan-details.dto';
import { ErrorCode } from 'src/common/exceptions/errorcode.enum';
import { PlansService } from './plans.service';
import { ProjectForbiddenException } from 'src/common/exceptions/custom.errors';
import { Transactional, TransactionalRequest } from 'src/common/decorators/transaction.decorator';
import { DeletePlanResponseDto } from './dtos/delete-plan.dto';
import { BasicUpdatePlanReqDTO, UpdatePlanUserReqDTO } from './dtos/update-plan.dto';

@ApiTags('Plans')
@Controller('/plans')
export class PlansController {
    constructor(private readonly plansService: PlansService) {}

    @Get('/:planId')
    @ApiOperation({
        summary: '일정 상세 페이지 조회 API',
        description: 'planId에 해당하는 일정 상세 페이지를 조회하는 API입니다.',
    })
    @ApiCommonResponse(PlanDetails)
    @ApiCommonErrorResponse(ErrorCode.PLAN_NOT_FOUND, 'PLAN_NOT_FOUND', 404)
    async getDetails(
        @Param('planId', ParseIntPipe) planId: number,
        @User('id') userId: number
    ): Promise<PlanDetails> {
        const check = await this.plansService.checkPermission(userId, planId);
        if (!check) throw new ProjectForbiddenException();
        return this.plansService.getDetails(planId);
    }

    @ApiOperation({
        summary: '일정 삭제 API',
        description: 'planId에 해당하는 일정을 삭제하는 API입니다.',
    })
    @ApiCommonResponse(DeletePlanResponseDto)
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
        summary: '일정 수정 API',
        description:
            'planId에 해당하는 일정의 참여자/기록자 리스트를 제외한 필드를 수정하는 API입니다. 회의록과 비고 필드는 일정의 기록자 권한이 있을 때만 수정 가능합니다.',
    })
    @ApiCommonResponse(PlanDetails)
    @Transactional()
    @Patch('/:planId')
    async updatePlan(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('planId', ParseIntPipe) planId: number,
        @Body() body: BasicUpdatePlanReqDTO
    ): Promise<PlanDetails> {
        return await this.plansService.updatePlan(req.queryRunner, userId, planId, body);
    }

    @ApiOperation({
        summary: '일정의 참여자/기록자 수정 API',
        description: 'planId에 해당하는 일정의 참여자/기록자 리스트를 수정하는 API입니다.',
    })
    @ApiCommonResponse(PlanDetails)
    @Transactional()
    @Patch('/:planId/users')
    async updatePlanUserList(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('planId', ParseIntPipe) planId: number,
        @Body() body: UpdatePlanUserReqDTO
    ): Promise<PlanDetails> {
        throw new NotImplementedException('서브 이슈로 추후 처리 예정입니다.');
    }
}
