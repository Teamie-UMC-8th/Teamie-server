import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { TransformInterceptor } from './common/interceptors/transform.interceptors';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { defaultConfig } from './config/app.config';
import { SwaggerModule } from '@nestjs/swagger';
import { createSwaggerConfig, publicPaths } from './config/swagger.config';
import * as cookieParser from 'cookie-parser'

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    app.use(cookieParser());

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
    // 공개 및 보안 문서 작성
    for (const path in document.paths) {
        for (const method in document.paths[path]) {
            const isPublic = publicPaths[path]?.includes(method.toLowerCase()) ?? false;
            if (isPublic) {
                document.paths[path][method].security = []; // 보안 해제
            } else {
                document.paths[path][method].security = [{ 'access-token': [] }];
            }
        }
    }
    SwaggerModule.setup(config.swagger.path, app, document);

    // 응답통일 및 예외처리
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
