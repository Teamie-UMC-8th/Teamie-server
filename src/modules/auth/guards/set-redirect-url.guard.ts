import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class SetRedirectUrlGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const { redirect_url } = request.query;

        if (redirect_url) {
            request.session.redirectUrl = redirect_url;
        }

        return true;
    }
}
