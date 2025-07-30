import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => {
                    return (
                        req?.cookies?.['accessToken'] || req?.headers?.authorization?.split(' ')[1]
                        // NOTE: 추후 개발 테스트가 끝난 후에는 쿠키로 방식 통일하기
                    );
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET')!,
        });
    }

    async validate(payload: any) {
        return { id: payload.userId };
    }
}
