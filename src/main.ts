import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { TransformInterceptor } from './common/interceptors/transform.interceptors';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { defaultConfig } from './config/app.config';
import { SwaggerModule } from '@nestjs/swagger';
import { createSwaggerConfig } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const config = defaultConfig(configService);

  // versioning
  const prefix = `${config.app.perfixes.api}/${config.app.version}`;
  app.setGlobalPrefix(prefix, {
    exclude: config.app.excludeRoutes,
  });

  // swagger
  const swaggerDocConfig = createSwaggerConfig(configService);
  const document = SwaggerModule.createDocument(app, swaggerDocConfig);
  SwaggerModule.setup(config.swagger.path, app, document);

  // 응답통일 및 예외처리
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
