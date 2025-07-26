import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthCheckModule } from './modules/health-check/health-check.module';
import { typeORMConfig } from './config/typeorm.config';
import { TasksModule } from './modules/tasks/tasks.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import type { RedisClientOptions } from 'redis';
import { PersonalRecallsModule } from './modules/personal-recalls/personal-recalls.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.gaurd';
import { S3TestController } from './infra/upload/upload.controller';
import { StepsModule } from './modules/steps/steps.module';
import { MasterPortfoliosModule } from './modules/master-portfolios/master-portfolios.module';
import { TaskFilesModule } from './modules/mappings/task-files/task-files.module';
import { PlansModule } from './modules/plans/plans.module';
import { CommentsModule } from './modules/comments/comments.module';
import { TransactionInterceptor } from './common/interceptors/transaction.interceptor';
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
                store: (await redisStore({
                    url: process.env.REDIS_URL, // .env에 저장한 주소
                })) as unknown,
                ttl: 0,
            }),
        }),
        HealthCheckModule,
        TasksModule,
        ProjectsModule,
        PersonalRecallsModule,
        AuthModule,
        UsersModule,
        StepsModule,
        MasterPortfoliosModule,
        TaskFilesModule,
        PlansModule,
        CommentsModule,
    ],
    controllers: [S3TestController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        }
    ],
})
export class AppModule {}
