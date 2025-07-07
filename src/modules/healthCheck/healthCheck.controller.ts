import { Controller, Get } from '@nestjs/common';

@Controller('/health')
export class HealthCheckController {

  @Get()
  getHello(): string {
    return "I'm Healthy";
  }
}
