import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { WsExceptionFilter } from '@nestjs/common'; // WsExceptionFilter 인터페이스 임포트

@Catch()
export class WebSocketExceptionFilter implements WsExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const client = host.switchToWs().getClient();
        let errorPayload = {
            status: 'error',
            message: 'Unknown error occurred',
        };

        if (exception instanceof HttpException) {
            // HttpException 처리
            const response = exception.getResponse();
            errorPayload.message =
                typeof response === 'object' ? (response as any).message : response;
        } else if (exception instanceof WsException) {
            // WsException 처리
            const response = exception.getError();
            errorPayload.message =
                typeof response === 'object' ? (response as any).message : response;
        } else if (exception instanceof Error) {
            // 일반 Error 처리
            errorPayload.message = exception.message;
        }
        client.emit('exception', errorPayload);
    }
}
