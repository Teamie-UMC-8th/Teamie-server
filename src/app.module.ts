import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthCheckModule } from './modules/healthCheck/healthCheck.module';
import { typeORMConfig } from './config/typeorm.config';
import { TasksModule } from './modules/tasks/tasks.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import type { RedisClientOptions } from 'redis';
import { PersonalRecallsModule } from './modules/personalRecalls/personalRecalls.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersController } from './modules/users/users.controller';
import { UsersService } from './modules/users/users.service';
import { UsersModule } from './modules/users/users.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeORMConfig,
    }),
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          url: process.env.REDIS_URL, // .env에 저장한 주소
        }) as unknown,
        ttl: 0,
      }),
    }),
    HealthCheckModule,
    TasksModule,
    ProjectsModule,
    PersonalRecallsModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class AppModule {}
