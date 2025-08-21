import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { CommonResponse } from '../response/common-response.dto';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        // CORS 헤더 명시적 설정 (오류 응답에도 포함)
        const origin = request.headers.origin;
        if (origin) {
            response.header('Access-Control-Allow-Origin', origin);
            response.header('Access-Control-Allow-Credentials', 'true');
        }

        let errorCode = 'UNKNOWN';
        let reason = '서버 에러가 발생했습니다.';
        let data = null;

        if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
            const res = exceptionResponse as any;
            errorCode = res.errorCode ?? errorCode;
            reason = res.message ?? reason;
            data = res.data ?? null;
        }

        const result = CommonResponse.fail(errorCode, reason, data);
        response.status(status).json(result);
    }
}
