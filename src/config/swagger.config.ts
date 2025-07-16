import { DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

const swaggerConfig = (configService: ConfigService) => ({
    title: configService.get<string>('SWAGGER_TITLE') || 'Teamie API docs',
    description:
        configService.get<string>('SWAGGER_DESCRIPTION') || 'API document of Teamie Project',
    version: configService.get<string>('SWAGGER_VERSION') || '1.0.0',
});

export const createSwaggerConfig = (configService: ConfigService) => {
    const config = swaggerConfig(configService);
    return new DocumentBuilder()
        .setTitle(config.title)
        .setDescription(config.description)
        .setVersion(config.version)
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'Authorization',
                in: 'header',
            },
            'access-token'
        )
        .build();
};

export const publicPaths = {
    '/auth/kakao': ['get'],
    '/auth/kakao/callback': ['get'],
    '/health': ['get'],
};
