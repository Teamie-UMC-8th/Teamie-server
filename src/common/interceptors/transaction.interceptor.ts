import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { catchError, finalize, Observable, tap } from 'rxjs';
import { DataSource, QueryRunner } from 'typeorm';
import { TRANSACTIONAL_KEY } from '../decorators/transaction.decorator';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
    constructor(
        private readonly dataSource: DataSource,
        private readonly reflector: Reflector
    ) {}
    async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        const isTransactional = this.reflector.get<boolean>(
            TRANSACTIONAL_KEY,
            context.getHandler()
        );
        if (!isTransactional) {
            return next.handle(); // 트랜잭션이 필요 없는 경우 그냥 다음 핸들러로 넘긴다.
        }

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

        contextObject.queryRunner = qr;

        return next.handle().pipe(
            catchError(async (error) => {
                await qr.rollbackTransaction();
                throw error;
            }),
            tap(async () => {
                await qr.commitTransaction();
            }),
            finalize(async () => {
                await qr.release();
                delete contextObject.queryRunner;
            })
        );
    }
}
