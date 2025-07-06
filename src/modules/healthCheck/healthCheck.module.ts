import { Module } from '@nestjs/common';
import { HealthCheckController } from './healthCheck.controller';

@Module({
  imports: [],
  controllers: [HealthCheckController],
})
export class HealthCheckModule {}
