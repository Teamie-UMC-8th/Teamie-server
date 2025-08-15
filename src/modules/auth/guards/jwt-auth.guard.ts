import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { LogoutUserException, UnAuthorizedException } from 'src/common/exceptions/custom.errors';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(
        private reflector: Reflector,
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

        const request = context.switchToHttp().getRequest();
        const token = request.cookies?.['accessToken'];
        // blacklist 체크
        if (token && (await this.authService.isTokenBlacklisted(token))) {
            throw new LogoutUserException();
        }

        const result = (await super.canActivate(context)) as boolean;
        return result;
    }
}
