import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: Socket = context.switchToWs().getClient();
        const handler = context.getHandler();

        // authenticate 이벤트의 우회
        if (handler.name === 'handleAuthenticate') return true;

        // 나머지 이벤트의 authenticate
        const user = client.data?.user;
        if (!user) throw new WsException('Unauthorized');
        return true;
    }
}
