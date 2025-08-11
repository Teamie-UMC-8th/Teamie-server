import { ArgumentsHost, Catch, WsExceptionFilter } from '@nestjs/common';

@Catch()
export class WebSocketExceptionFilter implements WsExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const client = host.switchToWs().getClient();
        console.log('Exception caught:', exception);

        let message = 'Unknown error';
        if (exception instanceof Error) message = exception.message;
        else if (exception?.message) message = exception.message;

        client.emit('error', { message: message });
    }
}
