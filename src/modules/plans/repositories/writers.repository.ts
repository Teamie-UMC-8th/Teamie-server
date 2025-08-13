import { Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { Writer } from '../entities/writers.entity';

@Injectable()
export class WriterRepository {
    constructor() {}

    async saveWriter(qr: QueryRunner, writer: Partial<Writer>): Promise<Writer> {
        return await qr.manager.save(Writer, writer);
    }

    async deleteWriter(qr: QueryRunner, planId: number, userId: number): Promise<void> {
        await qr.manager.delete(Writer, {
            plan: { id: planId },
            user: { id: userId },
        });
    }
}
