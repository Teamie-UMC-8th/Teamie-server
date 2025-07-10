import { Module } from '@nestjs/common';
import { RedisProvider } from './redis.providers';

@Module({
  providers: [RedisProvider],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}