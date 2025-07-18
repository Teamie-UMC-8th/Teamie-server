import { ApiProperty } from '@nestjs/swagger';

export class ManagerResponseDto {
    @ApiProperty({ example: 1, description: '담당자 userId' })
    userId: number;

    @ApiProperty({ example: '홍길동', description: '담당자 이름' })
    userName: string;
}
