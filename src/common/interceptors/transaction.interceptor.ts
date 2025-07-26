import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { catchError, finalize, Observable, tap } from 'rxjs';
import { DataSource, QueryRunner } from 'typeorm';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
    constructor(
        private readonly dataSource: DataSource,
        private readonly reflector: Reflector
    ) {}
    async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        // 현재 실행 컨텍스트에 따라 request 또는 client 객체를 가져온다.
        let contextObject: any;
        const contextType = context.getType();

        if (contextType === 'http') {
            contextObject = context.switchToHttp().getRequest();
        } else if (contextType === 'ws') {
            contextObject = context.switchToWs().getClient();
        } else {
            return next.handle(); // 지원하지 않는 컨텍스트 타입은 그냥 다음 핸들러로 넘긴다.
        }

        const qr: QueryRunner = this.dataSource.createQueryRunner();

        await qr.connect();
        await qr.startTransaction();

        // contextObject에 queryRunner를 추가하여 서비스에서 사용할 수 있도록 한다.
        contextObject.queryRunner = qr;

        return next.handle().pipe(
            tap(async () => {
                // 성공적으로 처리된 경우 트랜잭션을 커밋한다.
                await qr.commitTransaction();
                await qr.release();
            }),
            catchError(async (error) => {
                // 에러가 발생한 경우 트랜잭션을 롤백한다.
                await qr.rollbackTransaction();
                await qr.release();
                throw error;
            })
        );
    }
}
