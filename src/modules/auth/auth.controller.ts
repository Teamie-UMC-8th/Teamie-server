import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './services/auth.service';
import { ConfigService } from '@nestjs/config';
import { KakaoUser, KakaoUserAfterAuth } from 'src/common/decorators/user.decorator';
import { Response } from 'express';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Pulbic } from 'src/common/decorators/public.decorator';
import { SetRedirectUrlGuard } from './guards/set-redirect-url.guard';
import { InternalServerError } from 'src/common/exceptions/custom.errors';

@ApiTags('Auth')
@Controller('/auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService
    ) {}

    @ApiOperation({
        summary: '카카오 로그인 트리거',
        description: '카카오 인증페이지로 리다이렉트합니다. 스웨거에서 누르지 마세요.',
    })
    @ApiQuery({
        name: 'redirect_url',
        description: '리다이렉트 될 base_url을 쿼리 파라미터로 포함합니다.',
        required: false,
    })
    @ApiResponse({
        status: 302,
        description: '카카오 로그인 페이지로 리다이렉트됨.',
    })
    @Pulbic()
    @UseGuards(SetRedirectUrlGuard, AuthGuard('kakao'))
    @Get('/kakao')
    async kakaoLogin(@Query('redirect_url') redirect_url?: string) {}

    @ApiOperation({
        summary: '카카오 로그인 콜백',
        description:
            '로그인 로직이 이루어지고 프론트로 리다이렉트됩니다. 스웨거에서 누르지 마세요.',
    })
    @ApiResponse({
        status: 302,
        description: '프론트엔드 페이지로 리다이렉트됨',
    })
    @Pulbic()
    @UseGuards(AuthGuard('kakao'))
    @Get('/kakao/callback')
    async kakaoCallback(
        @Req() req: any,
        @KakaoUser() user: KakaoUserAfterAuth,
        @Res() res: Response
    ): Promise<void> {
        // 클라이언트 요청 host 파싱
        const baseRedirect =
            req.session.redirectUrl ||
            this.configService.get('CLIENT_REDIRECT_URI') ||
            'http://localhost:3000';
        const safeOrigin = this.authService.validateRedirectOrigin(baseRedirect)
            ? baseRedirect
            : this.configService.get('CLIENT_REDIRECT_URI') || 'http://localhost:3000';
        const redirectPath = this.configService.get('CLIENT_REDIRECT_PATH') || '/docs';
        // 슬래시 중복 방지
        const fullRedirect = safeOrigin.endsWith('/')
            ? safeOrigin.slice(0, -1) + redirectPath
            : safeOrigin + redirectPath;

        // 사용자 인증 by JWT
        const kakaoUser = user;
        const accessToken = await this.authService.handleKakaoLogin(kakaoUser);
        req.session.destroy((err: Error) => {
            if (err) {
                throw new InternalServerError('세션 파괴 중 에러 발생');
            }
            res.clearCookie('connect.sid', {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
            });

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: this.configService.get('JWT_EXPIRES_IN') || 1000 * 60 * 60, // 1시간
            });
            //TODO: 추후 refreshToken 구현 필요
            res.redirect(fullRedirect);
        });
    }
}
