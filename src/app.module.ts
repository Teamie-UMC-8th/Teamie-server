import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthCheckModule } from './modules/healthCheck/healthCheck.module';
import { typeORMConfig } from './config/typeorm.config';
import { S3TestController } from './modules/upload/upload.controller';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    //TypeOrmModule.forRootAsync({
    //  imports: [ConfigModule],
    //  inject: [ConfigService],
    ///  useFactory: typeORMConfig,
    //}),
    HealthCheckModule,],
    controllers: [S3TestController],
})
export class AppModule {}
