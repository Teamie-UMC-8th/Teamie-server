import { Controller, Get, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { ConfigService } from "@nestjs/config";
import { KakaoUser, KakaoUserAfterAuth } from "src/common/decorators/user.decorator";
import { Response } from "express";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags('Auth')
@Controller('/auth')
export class AuthController{
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService
    ){}

    @Get('/kakao')
    @UseGuards(AuthGuard('kakao'))
    @ApiOperation({
        summary: '카카오 로그인 트리거',
        description: '카카오 인증페이지로 리다이렉트합니다.'
    })
    @ApiResponse({
        status: 302,
        description: "카카오 로그인 페이지로 리다이렉트됨"
    })
    async kakaoLogin(){}

    @Get('/kakao/callback')
    @UseGuards(AuthGuard('kakao'))
    @ApiOperation({
        summary: '카카오 로그인 콜백',
        description: '카카오 인증 후 백엔드로 리다이렉트됩니다. 로그인 로직이 이루어지고 프론트로 리다이렉트됩니다.'
    })
    @ApiResponse({
        status: 302,
        description: "프론트엔드 페이지로 리다이렉트됨"
    })
    async kakaoCallback(
        @KakaoUser() req: KakaoUserAfterAuth,
        @Res() res: Response,
    ): Promise<void> {
        const kakaoUser = req;
        const userId = await this.authService.handleKakaoLogin(kakaoUser);
        console.log(userId);    // TODO: 서버 자체 JWT 적용하여 cookie로 토큰 넘기도록 수정할 예정.
        res.redirect(this.configService.get('CLIENT_REDIRECT_URI')!);    // NOTE: 환경변수 없으면 터짐!
    }
}