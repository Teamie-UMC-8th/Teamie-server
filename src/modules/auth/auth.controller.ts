import { Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { ConfigService } from "@nestjs/config";
import { KakaoUser, KakaoUserAfterAuth } from "src/common/decorators/user.decorator";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Pulbic } from "src/common/decorators/public.decorator";

@ApiTags('Auth')
@Controller('/auth')
export class AuthController{
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService
    ){}

    @Pulbic()
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

    @Pulbic()
    @Get('/kakao/callback')
    @UseGuards(AuthGuard('kakao'))
    @ApiOperation({
        summary: '카카오 로그인 콜백',
        description: '로그인 로직이 이루어지고 프론트로 리다이렉트됩니다.'
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
        const accessToken = await this.authService.handleKakaoLogin(kakaoUser);
        res.cookie('accessToken', accessToken,{
            httpOnly: true,
            secure: false,  // NOTE: HTTPS 전송 강제, 도메인 붙이게 되면 변경하기
            sameSite: 'lax',
            maxAge: 100 * 60 * 60,  // 1시간
        });
        //TODO: 추후 refreshToken 구현 필요
        res.redirect(this.configService.get('CLIENT_REDIRECT_URI')!);    // NOTE: 환경변수 없으면 터짐!
    }
}