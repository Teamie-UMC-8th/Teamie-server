import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './auth.controller';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RedisModule } from 'src/infra/redis/redis.module';

@Module({
    imports: [
        PassportModule,
        UsersModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get<number>('JWT_EXPIRES_IN') || 60 * 60,
                },
            }),
            inject: [ConfigService],
        }),
        RedisModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, KakaoStrategy, JwtStrategy, JwtAuthGuard],
    exports: [AuthService],
})
export class AuthModule {}
