import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { CommonResponse } from '../response/common-response.dto';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, CommonResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<CommonResponse<T>> {
        return next.handle().pipe(map((data) => CommonResponse.success(data)));
    }
}
