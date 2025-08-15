import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { LogoutUserException, UnAuthorizedException } from 'src/common/exceptions/custom.errors';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(
        private reflector: Reflector,
        private readonly configService: ConfigService,
        private readonly authService: AuthService
    ) {
        super();
    }

    handleRequest<TUser = any>(
        err: any,
        user: any,
        info: any,
        context: ExecutionContext,
        status?: any
    ): TUser {
        if (err || !user) {
            throw new UnAuthorizedException();
        }
        return user;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;
        // 마스터 토큰 체크
        const request = context.switchToHttp().getRequest();
        const token = request.cookies?.['accessToken'];
        if (token && token === this.configService.get('MASTER_JWT')) {
            request.user = {
                id: this.configService.get('MASTER_USER_ID'),
            };
            return true;
        }

        // blacklist 체크
        if (token && (await this.authService.isTokenBlacklisted(token))) {
            throw new LogoutUserException();
        }

        const result = (await super.canActivate(context)) as boolean;
        return result;
    }
}
