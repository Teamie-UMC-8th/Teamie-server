import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class CreateQuestions {
    @ApiProperty({
        type: [Number],
        required: true,
        isArray: true,
        example: [1, 2, 3],
        description: '선택한 회의록 ID 리스트',
    })
    @IsArray()
    recordIdList: number[];
}
