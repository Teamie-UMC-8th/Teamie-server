import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { TransactionInterceptor } from '../interceptors/transaction.interceptor';
import { Request } from 'express';

export function Transactional() {
    return applyDecorators(UseInterceptors(TransactionInterceptor));
}

export interface TransactionalRequest extends Request {
    queryRunner: import('typeorm').QueryRunner;
}
