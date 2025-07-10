import { Injectable } from '@nestjs/common';
import { KakaoUserAfterAuth } from 'src/common/decorators/user.decorator';

@Injectable()
export class AuthService {

    async handleKakaoLogin(kakaoUser: KakaoUserAfterAuth) {
        //1. DB에 사용자가 있는지 확인
        //2. DB에 사용자가 없다면 회원가입 진행
        //3. 서비스 자체 JWT 토큰 발급
        return 1;
    }
}
