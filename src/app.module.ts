import { Module } from '@nestjs/common';
import { HealthCheckModule } from './modules/healthCheck/healthCheck.module';

@Module({
  imports: [HealthCheckModule],
})
export class AppModule {}
