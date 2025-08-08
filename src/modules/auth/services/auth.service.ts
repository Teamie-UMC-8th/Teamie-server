import { Injectable } from '@nestjs/common';
import { KakaoUserAfterAuth } from 'src/common/decorators/user.decorator';
import { UsersService } from '../../users/services/users.service';
import { JwtService } from '@nestjs/jwt';
import { UserInvariantViolationException } from 'src/common/exceptions/custom.errors';
import { WsException } from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) {}

    async handleKakaoLogin(kakaoUser: KakaoUserAfterAuth): Promise<String> {
        //1. DB에 사용자가 있는지 확인
        const user = await this.userService.findUserByKakaoId(kakaoUser.id);
        //2. DB에 사용자가 없다면 회원가입 진행
        let userId = user?.id;
        if (!user) {
            const newUser = await this.userService.createUser(kakaoUser);
            userId = newUser.id;
        }
        //3. JWT 토큰 발급
        if (!userId) {
            throw new UserInvariantViolationException();
        }
        return this.generateAccessToken(userId!);
    }

    generateAccessToken(userId: number): string {
        const payload = {
            userId: userId,
        };
        return this.jwtService.sign(payload);
    }

    async verifyWsToken(token: string): Promise<number> {
        try {
            const payload = await this.jwtService.verifyAsync(token);
            return payload.userId;
        } catch (err) {
            throw new WsException('Invalid token');
        }
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
