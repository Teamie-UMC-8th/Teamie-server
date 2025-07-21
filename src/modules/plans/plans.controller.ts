import { Controller, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PlansGateway } from './gateways/plans.gateway';
import { Pulbic } from 'src/common/decorators/public.decorator';

@ApiTags('Plans')
@ApiBearerAuth('access-token')
@Controller('/plans')
export class PlansController {
    constructor(private readonly plansGateway: PlansGateway) {}

    @Pulbic()
    @Patch('/test/:planId')
    async testBroadCast(@Param('planId') planId: number) {
        this.plansGateway.broadCastUpdate(planId, '브로드캐스트 테스트');
        return 'test';
    }
}
