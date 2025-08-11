import { Injectable } from '@nestjs/common';
import { UpdateCocommentResponseDto, UpdateCocommentRequestDto } from '../dto/update-cocomment.dto';
import {
    CocommentUpdateForbiddenException,
    CocommentDeleteForbiddenException,
} from 'src/common/exceptions/custom.errors';
import { CommonResponse } from 'src/common/response/common-response.dto';
import { QueryRunner } from 'typeorm';
import { CocommentRepository } from '../repositories/cocoment.repository';

@Injectable()
export class CocommentsService {
    constructor(private readonly cocommentRepository: CocommentRepository) {}

    async updateCocomment(
        queryRunner: QueryRunner,
        userId: number,
        cocommentId: number,
        dto: UpdateCocommentRequestDto
    ): Promise<UpdateCocommentResponseDto> {
        const cocomment = await this.cocommentRepository.findByIdWithUserWithQueryRunner(
            queryRunner,
            cocommentId
        );

        if (userId !== cocomment.user.id) {
            throw new CocommentUpdateForbiddenException();
        }

        cocomment.content = dto.content;

        const updatedComment = await this.cocommentRepository.saveCocommentWithQueryRunner(
            queryRunner,
            cocomment
        );

        return UpdateCocommentResponseDto.from(updatedComment);
    }

    async deleteCocomment(
        queryRunner: QueryRunner,
        userId: number,
        cocommentId: number
    ): Promise<CommonResponse> {
        // 대댓글 존재 여부 확인
        const cocomment = await this.cocommentRepository.findByIdWithUserWithQueryRunner(
            queryRunner,
            cocommentId
        );

        // 대댓글 작성자와 로그인한 유저가 같은지 확인
        if (cocomment.user.id !== userId) {
            throw new CocommentDeleteForbiddenException();
        }

        // 대댓글 삭제
        await this.cocommentRepository.deleteCocommentWithQueryRunner(queryRunner, cocommentId);

        return CommonResponse.success({ message: `대댓글 ID ${cocommentId} 삭제 완료` });
    }
}
