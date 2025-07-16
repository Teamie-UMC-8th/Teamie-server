import { ApiProperty } from '@nestjs/swagger';

export class DeleteTaskResponseDto {
    @ApiProperty({
        example: '업무가 성공적으로 삭제되었습니다.',
        description: '삭제 성공 메시지',
    })
    message: string;

    @ApiProperty({
        example: 42,
        description: '삭제된 업무 ID',
    })
    taskId: number;
}
