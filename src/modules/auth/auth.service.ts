import { Injectable } from '@nestjs/common';
import { KakaoUserAfterAuth } from 'src/common/decorators/user.decorator';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UsersService
    ){}

    async handleKakaoLogin(kakaoUser: KakaoUserAfterAuth) {
        //1. DB에 사용자가 있는지 확인
        const user = await this.userService.findUserByKakaoId(kakaoUser.id);
        
        //2. DB에 사용자가 없다면 회원가입 진행
        let userId = user?.id;
        if(!user){
            const newUser = await this.userService.createUser(kakaoUser);
            userId = newUser.id;
        }
        //3. 서비스 자체 JWT 토큰 발급
        // TODO: JWT
        return userId;
    }
}
