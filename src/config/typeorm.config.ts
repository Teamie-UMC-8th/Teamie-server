import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const typeORMConfig = (configService: ConfigService): TypeOrmModuleOptions => {
    console.log('DB_HOST:', configService.get<string>('DB_HOST'));
    console.log('DB_NAME:', configService.get<string>('DB_NAME'));
    return {
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/../modules/**/*.entity.{ts,js}'],
        synchronize: true, //개발단계에서만 허용
    };
};
