import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator((data, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.user?.[data] : request.user;
});

export const KakaoUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
});

export interface KakaoUserAfterAuth {
    id: string;
    nickname: string;
    email: string;
    profileImage: string;
}
