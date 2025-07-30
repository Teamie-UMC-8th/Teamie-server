import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Cocomment } from './cocomments.entity';
import { UpdateCocommentResponseDto, UpdateCocommentRequestDto } from './dto/update-cocomment.dto';
import {
    CocommentUpdateForbiddenException,
    CocommentNotFoundException,
    CocommentDeleteForbiddenException,
} from 'src/common/exceptions/custom.errors';
import { CommonResponse } from 'src/common/response/common-response.dto';
import { QueryRunner } from 'typeorm';
import { query } from 'express';

@Injectable()
export class CocommentsService {
    constructor(
        @InjectRepository(Cocomment)
        private readonly cocommentRepository: Repository<Cocomment>
    ) {}

    async updateComment(
        userId: number,
        cocommentId: number,
        dto: UpdateCocommentRequestDto,
        queryRunner: QueryRunner
    ): Promise<UpdateCocommentResponseDto> {
        const cocomment = await queryRunner.manager
            .createQueryBuilder(Cocomment, 'cocomment')
            .leftJoin('cocomment.user', 'user')
            .addSelect(['user.id'])
            .where('cocomment.id = :cocommentId', { cocommentId })
            .select(['cocomment.id', 'cocomment.content', 'user.id']) 
            .getOne();

        if (!cocomment) {
            throw new CocommentNotFoundException();
        }

        if (userId !== cocomment.user.id) {
            throw new CocommentUpdateForbiddenException();
        }

        cocomment.content = dto.content;

        const updatedComment = await queryRunner.manager.save(Cocomment, cocomment);

        return UpdateCocommentResponseDto.from(updatedComment);
    }

    async deleteCocomment(
            userId: number,
            cocommentId: number,
            queryRunner: QueryRunner
        ): Promise<CommonResponse> {
            // 대댓글 존재 여부 확인
            const cocomment = await queryRunner.manager
                .createQueryBuilder(Cocomment, 'cocomment')
                .leftJoinAndSelect('cocomment.user', 'user')
                .where('cocomment.id = :cocommentId', { cocommentId })
                .getOne();
    
            if (!cocomment) {
                throw new CocommentNotFoundException();
            }
    
            // 대댓글 작성자와 로그인한 유저가 같은지 확인
            if (cocomment.user.id !== userId) {
                throw new CocommentDeleteForbiddenException();
            }
    
            // 대댓글 삭제
            await queryRunner.manager.delete(Cocomment, { id: cocommentId });
    
            return CommonResponse.success({ message: `대댓글 ID ${cocommentId} 삭제 완료` });
        }
}
