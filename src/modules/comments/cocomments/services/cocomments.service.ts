import { Injectable } from '@nestjs/common';
import { UpdateCocommentResponseDto, UpdateCocommentRequestDto } from '../dto/update-cocomment.dto';
import {
    CocommentUpdateForbiddenException,
    CocommentDeleteForbiddenException,
} from 'src/common/exceptions/custom.errors';
import { CommonResponse } from 'src/common/response/common-response.dto';
import { QueryRunner } from 'typeorm';
import { CocommentRepository } from '../repositories/cocoment.repository';
import { UpdatedCocommentDTO } from '../dto/cocomment-payload.dto';
import { RealTimeEntity, RealTimeType } from 'src/common/response/real-time-response.dto';
import { EventPayloadDto } from 'src/common/dtos/event-payload.dto';
import { EventBusService } from 'src/infra/event-bus/event-bus.service';
@Injectable()
export class CocommentsService {
    constructor(
        private readonly cocommentRepository: CocommentRepository,
        private readonly eventBus: EventBusService
    ) {}

    async updateCocomment(
        queryRunner: QueryRunner,
        userId: number,
        cocommentId: number,
        dto: UpdateCocommentRequestDto
    ): Promise<UpdateCocommentResponseDto> {
        const cocomment = await this.cocommentRepository.findByIdWithUserAndTaskForEventUsingQR(
            queryRunner,
            cocommentId
        );

        if (userId !== cocomment.user.id) {
            throw new CocommentUpdateForbiddenException();
        }

        cocomment.content = dto.content;

        const updatedCocomment = await this.cocommentRepository.saveCocommentWithQueryRunner(
            queryRunner,
            cocomment
        );

        await this.eventBus.publishAsync(
            `${RealTimeEntity.COCOMMENT}.${RealTimeType.UPDATED}`,
            EventPayloadDto.from(RealTimeType.UPDATED, {
                taskId: cocomment.comment.task.id,
                cocomment: UpdatedCocommentDTO.from(updatedCocomment),
            })
        );

        return UpdateCocommentResponseDto.from(updatedCocomment);
    }

    async deleteCocomment(
        queryRunner: QueryRunner,
        userId: number,
        cocommentId: number
    ): Promise<CommonResponse> {
        // 대댓글 존재 여부 확인
        const cocomment = await this.cocommentRepository.findByIdWithUserAndTaskForEventUsingQR(
            queryRunner,
            cocommentId
        );

        // 대댓글 작성자와 로그인한 유저가 같은지 확인
        if (cocomment.user.id !== userId) {
            throw new CocommentDeleteForbiddenException();
        }

        // 대댓글 삭제
        await this.cocommentRepository.deleteCocommentWithQueryRunner(queryRunner, cocommentId);

        //웹소켓 이벤트 발행
        await this.eventBus.publishAsync(
            `${RealTimeEntity.COCOMMENT}.${RealTimeType.DELETED}`,
            EventPayloadDto.from(RealTimeType.DELETED, {
                taskId: cocomment.comment.task.id,
                cocommentId,
            })
        );

        return CommonResponse.success({ message: `대댓글 ID ${cocommentId} 삭제 완료` });
    }
}
