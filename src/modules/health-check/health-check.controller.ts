import { Controller, Get } from '@nestjs/common';
import { Pulbic } from 'src/common/decorators/public.decorator';

@Controller('/health')
export class HealthCheckController {
    @Pulbic()
    @Get()
    getHello(): string {
        return "I'm Healthy";
    }
}
