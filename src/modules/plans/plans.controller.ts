import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req } from '@nestjs/common';
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
import { CreatePlanReq, CreatePlanResponse } from './dtos/create-plan.dto';
import { Transactional, TransactionalRequest } from 'src/common/decorators/transaction.decorator';

@ApiTags('Plans')
@Controller('/plans')
export class PlansController {
    constructor(
        private readonly plansGateway: PlansGateway,
        private readonly plansService: PlansService
    ) {}

    @Post()
    @ApiOperation({
        summary: '일정 생성 API',
        description: '팀 캘린더에서 새로운 일정을 생성하는 API입니다.',
    })
    @ApiCommonResponse(CreatePlanResponse)
    @Transactional()
    async createPlan(
        @Req() req: TransactionalRequest,
        @Body() body: CreatePlanReq,
        @User('id') userId: number
    ): Promise<CreatePlanResponse> {
        const projectId: number = Number(body.projectId);
        const date: Date = new Date(body.date);
        return await this.plansService.createPlan(req.queryRunner, userId, projectId, date);
    }

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
}
