import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { TransformInterceptor } from './common/interceptors/transform.interceptors';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { allowedOrigins, defaultConfig } from './config/app.config';
import { SwaggerModule } from '@nestjs/swagger';
import { createSwaggerConfig, publicPaths } from './config/swagger.config';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: (
            origin: string | undefined,
            callback: (err: Error | null, allow?: boolean) => void
        ) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            } else {
                return callback(new Error(`CORS: ${origin} is not allowed`), false);
            }
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    app.use(cookieParser());

    app.use(
        session({
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: {
                maxAge: 360000,
            },
        })
    );

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
        })
    );

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
