import { Controller, Post, Body } from '@nestjs/common';
import { StepsService } from './steps.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
    ApiCommonResponse,
    ApiCommonErrorResponse,
} from '../../common/response/swagger-response.helper';
import { CreateStepDto } from './dtos/create-step.dto';
import { User } from 'src/common/decorators/user.decorator';
@ApiTags('Steps')
@ApiBearerAuth('access-token')
@Controller('/steps')
export class StepsController {
    constructor(private readonly stepsService: StepsService) {}
}
