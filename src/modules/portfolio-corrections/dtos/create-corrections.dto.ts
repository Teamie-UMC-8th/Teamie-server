import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class CreateCorrectionsDto {
    @ApiProperty({
        description: '선택된 프로젝트 ID 목록',
        type: [Number],
        example: [1, 2, 3],
    })
    @IsArray()
    selectedProjects: number[];
}
