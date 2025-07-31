import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UserMainTaskRequestDTO {
    @ApiProperty({
        example: '자료조사, 정리',
        description: '주요 업무 필드(마스터 포트폴리오)',
    })
    @IsString()
    @MaxLength(24)
    mainTask: string;
}
