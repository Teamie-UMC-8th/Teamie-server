import { ApiProperty } from '@nestjs/swagger';

export class DeletePlanResponseDto {
    @ApiProperty({
        example: '일정이 성공적으로 삭제되었습니다.',
        description: '삭제 성공 메시지',
    })
    message: string;

    @ApiProperty({
        example: 42,
        description: '삭제된 일정 ID',
    })
    planId: number;

    static from(planId: number) {
        const dto = new DeletePlanResponseDto();
        dto.message = '일정이 성공적으로 삭제되었습니다.';
        dto.planId = planId;
        return dto;
    }
}
