import { Inject, Injectable } from '@nestjs/common';
import { KakaoUserAfterAuth } from 'src/common/decorators/user.decorator';
import { UsersService } from '../../users/services/users.service';
import { JwtService } from '@nestjs/jwt';
import {
    TransactionException,
    UnAuthorizedException,
    UserInvariantViolationException,
} from 'src/common/exceptions/custom.errors';
import { WsException } from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { QueryRunner } from 'typeorm';
import { RedisClientType } from 'redis';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        @Inject('REDIS_CLIENT')
        private readonly redis: RedisClientType
    ) {}

    async handleKakaoLogin(
        qr: QueryRunner,
        kakaoUser: KakaoUserAfterAuth
    ): Promise<{ accessToken: string; refreshToken: string }> {
        try {
            //1. DB에 사용자가 있는지 확인
            const user = await this.userService.findUserByKakaoId(qr, kakaoUser.id);
            //2. DB에 사용자가 없다면 회원가입 진행
            let userId = user?.id;
            if (!user) {
                const newUser = await this.userService.createUser(qr, kakaoUser);
                userId = newUser.id;
            }
            //3. JWT 토큰 발급
            if (!userId) {
                throw new UserInvariantViolationException();
            }
            const accessToken = await this.generateAccessToken(userId);
            const refreshToken = await this.generateRefreshToken(userId);
            return { accessToken, refreshToken };
        } catch (err) {
            console.log(err);
            throw new TransactionException('Auth');
        }
    }

    async refreshAccessToken(refreshToken: string): Promise<string> {
        if (!refreshToken) throw new UnAuthorizedException('리프레시 토큰이 존재하지 않음.');
        const payload = await this.jwtService.verifyAsync(refreshToken, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        });
        const isValid = await this.verifyRefreshToken(
            refreshToken,
            payload.userId,
            payload.tokenId
        );
        if (!isValid) throw new UnAuthorizedException('리프레시 토큰이 만료됨.');
        return await this.generateAccessToken(payload.userId);
    }

    async generateAccessToken(userId: number): Promise<string> {
        const payload = {
            userId: userId,
        };
        return this.jwtService.sign(payload);
    }

    async generateRefreshToken(userId: number): Promise<string> {
        const tokenId = crypto.randomUUID();
        const payload = {
            userId: userId,
            tokenId: tokenId,
        };

        const exp = this.configService.get<number>('JWT_REFRESH_EXPIRES_IN') || 60 * 60 * 24; //NOTE: 1d
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: exp,
        });

        const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await this.redis.set(`refreshToken:${userId}:${tokenId}`, hashedToken, { EX: exp });
        return refreshToken;
    }

    async verifyWsToken(token: string): Promise<number> {
        try {
            const payload = await this.jwtService.verifyAsync(token);
            return payload.userId;
        } catch (err) {
            throw new WsException('Invalid token');
        }
    }

    async verifyRefreshToken(refreshToken: string, userId: number, tokenId: number) {
        const storedHash = await this.redis.get(`refreshToken:${userId}:${tokenId}`);
        if (!storedHash) return false;

        const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        return hash === storedHash;
    }

    // 리프레시 토큰 무효화
    async revokeRefreshToken(refreshToken: string) {
        const payload = await this.jwtService.verifyAsync(refreshToken, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        });
        await this.redis.del(`refreshToken:${payload.userId}:${payload.tokenId}`);
    }

    async blacklistToken(token: string) {
        const decoded: any = this.jwtService.decode(token);
        const exp = decoded?.exp || this.configService.get('JWT_EXPIRES_IN') || 60 * 60;
        const ttl = Math.floor(exp - Date.now() / 1000);
        if (ttl > 0) {
            await this.redis.set(`blacklist:${token}`, '1', { EX: ttl });
        }
    }

    async isTokenBlacklisted(token: string): Promise<boolean> {
        return !!(await this.redis.get(`blacklist:${token}`));
    }

    validateRedirectOrigin(url: string): boolean {
        try {
            const parsed = new URL(url);
            const rawOrigins: string =
                this.configService.get('CORS_ORIGIN') || 'http://localhost:3000';
            const allowedOrigins = rawOrigins.split(',').map((origin) => origin.trim());
            return allowedOrigins.includes(parsed.origin);
        } catch {
            return false;
        }
    }
}
