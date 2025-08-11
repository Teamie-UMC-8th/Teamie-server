import { RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const defaultConfig = (configService: ConfigService) => ({
    app: {
        baseUrl: configService.get<string>('BASE_URL'),
        version: configService.get<string>('API_VERSION'),
        perfixes: {
            api: 'api',
            auth: 'auth',
        },
        excludeRoutes: [
            {
                path: 'auth/(.*)',
                method: RequestMethod.ALL,
            },
            {
                path: '/health',
                method: RequestMethod.GET,
            },
        ],
    },
    swagger: {
        path: configService.get<string>('SWAGGER_PATH') || 'docs',
    },
});

const rawOrigins = process.env.CORS_ORIGIN || 'http://localhost:3000';
export const allowedOrigins = rawOrigins.split(',').map((origin) => origin.trim());
