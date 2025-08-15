import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { TransactionInterceptor } from '../interceptors/transaction.interceptor';
import { Request } from 'express';
import { Session } from 'express-session';

export function Transactional() {
    return applyDecorators(UseInterceptors(TransactionInterceptor));
}

export interface SessionRequest extends Request {
    session: Session & { redirectUrl?: string };
}

export interface TransactionalRequest extends SessionRequest {
    queryRunner: import('typeorm').QueryRunner;
}
