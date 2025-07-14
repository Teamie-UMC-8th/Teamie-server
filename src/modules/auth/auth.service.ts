import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { KakaoUserAfterAuth } from 'src/common/decorators/user.decorator';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UsersService,
        private readonly jwtService: JwtService,
    ){}

    async handleKakaoLogin(kakaoUser: KakaoUserAfterAuth): Promise<String> {
        //1. DB에 사용자가 있는지 확인
        const user = await this.userService.findUserByKakaoId(kakaoUser.id);
        //2. DB에 사용자가 없다면 회원가입 진행
        let userId = user?.id;
        if(!user){
            const newUser = await this.userService.createUser(kakaoUser);
            userId = newUser.id;
        }
        //3. JWT 토큰 발급
        if(!userId){
            throw new InternalServerErrorException(
                '로직 상 userId는 null일 수 없습니다.'
            );
        }
        return this.generateAccessToken(userId!);
    }

    generateAccessToken(userId: number): string {
        const payload = {
            userId: userId,
        };
        return this.jwtService.sign(payload);
    }
}
