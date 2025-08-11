import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { Cocomment } from '../entities/cocomments.entity';
import { CocommentNotFoundException } from '../../../../common/exceptions/custom.errors';
import { Injectable } from '@nestjs/common';
@Injectable()
export class CocommentRepository {
    constructor(@InjectRepository(Cocomment) private readonly repo: Repository<Cocomment>) {}

    // cocomment 조회
    async findCocommentByIdWithQueryRunner(
        queryRunner: QueryRunner,
        cocommentId: number
    ): Promise<Cocomment> {
        const cocomment = await queryRunner.manager.findOne(Cocomment, {
            where: { id: cocommentId },
        });

        if (!cocomment) {
            throw new CocommentNotFoundException();
        }

        return cocomment;
    }

    //작성자(User)와 함께 cocomment조회
    async findByIdWithUserWithQueryRunner(
        queryRunner: QueryRunner,
        cocommentId: number
    ): Promise<Cocomment> {
        const cocomment = await queryRunner.manager
            .createQueryBuilder(Cocomment, 'cocomment')
            .leftJoinAndSelect('cocomment.user', 'user')
            .select(['cocomment.id', 'cocomment.content'])
            .addSelect(['user.id'])
            .where('cocomment.id = :cocommentId', { cocommentId })
            .getOne();

        if (!cocomment) {
            throw new CocommentNotFoundException();
        }
        return cocomment;
    }

    // cocomment 삭제
    async deleteCocommentWithQueryRunner(
        queryRunner: QueryRunner,
        cocommentId: number
    ): Promise<void> {
        await queryRunner.manager.delete(Cocomment, { id: cocommentId });
    }

    // cocomment 저장
    async saveCocommentWithQueryRunner(
        queryRunner: QueryRunner,
        cocomment: Cocomment
    ): Promise<Cocomment> {
        return queryRunner.manager.save(Cocomment, cocomment);
    }
}
