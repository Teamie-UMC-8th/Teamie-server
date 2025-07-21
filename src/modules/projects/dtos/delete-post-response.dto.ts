import { ApiProperty } from '@nestjs/swagger';
export class DeletePostResponseDto {
    @ApiProperty({
        example: '포스트잇이 성공적으로 삭제되었습니다.',
        description: '삭제 성공 완료 메세지',
    })
    message: string;
}
