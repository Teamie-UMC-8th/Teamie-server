import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-kakao';
import { InternalServerError } from 'src/common/exceptions/custom.errors';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService) {
        super({
            // Note : Non-null 연산자 사용으로 .env 관리가 안되면 런타임 에러 납니당~
            clientID: configService.get('KAKAO_CLIENT_ID')!,
            clientSecret: configService.get('KAKAO_CLIENT_SECRET')!,
            callbackURL: configService.get('KAKAO_CALLBACK_URL')!,
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: Profile): Promise<any> {
        try {
            const { _json } = profile;
            const user = {
                id: _json.id.toString(),
                nickname: _json.properties?.nickname,
                email: _json.kakao_account?.email,
                profileImage: _json.properties?.profile_image,
            };
            return user;
        } catch (error) {
            throw new InternalServerError('인증 중 에러가 발생하였습니다.');
        }
    }
}
