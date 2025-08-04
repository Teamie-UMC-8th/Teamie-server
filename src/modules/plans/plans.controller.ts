import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlansGateway } from './gateways/plans.gateway';
import { Pulbic } from 'src/common/decorators/public.decorator';
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

@ApiTags('Plans')
@Controller('/plans')
export class PlansController {
    constructor(
        private readonly plansGateway: PlansGateway,
        private readonly plansService: PlansService
    ) {}

    @Pulbic()
    @Patch('/test/:planId')
    async testBroadCast(@Param('planId') planId: number) {
        //TODO: 추후 삭제하기
        this.plansGateway.broadCastUpdate(planId, '브로드캐스트 테스트');
        return 'test';
    }

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
}
