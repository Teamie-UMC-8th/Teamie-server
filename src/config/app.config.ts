import { ConfigService } from "@nestjs/config"

export const defaultConfig = (configService: ConfigService) => ({
    app: {
        baseUrl: configService.get<string>('BASE_URL'), 
        version: configService.get<string>('API_VERSION'),
        perfixes: {
            api: 'api',
            auth: 'auth',
        },
        excludeRoutes: [
            /* TODO : auth 관련 API 버전 prefix 제외.
            {
                path: 'auth/v1/login',
                method: RequestMethod.POST,
            }
            */
        ],
    },
    swagger: {
        path: configService.get<string>('SWAGGER_PATH') || 'docs',
    },
});