import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: Socket = context.switchToWs().getClient();
        const token = client.handshake.query.token as string;

        if (!token) throw new WsException('Missiong token');

        try {
            const payload = await this.jwtService.verifyAsync(token);
            client.data.userId = payload.userId;
            return true;
        } catch (err) {
            throw new WsException('Invalid token');
        }
    }
}
