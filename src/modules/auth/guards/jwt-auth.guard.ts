import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { UnAuthorizedException } from 'src/common/exceptions/custom.errors';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(
        private reflector: Reflector,
        private readonly configService: ConfigService
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

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
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
        return super.canActivate(context);
    }
}
