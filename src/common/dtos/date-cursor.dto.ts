import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { IsISODateString } from '../decorators/validate-iso-date.decorator';

export class DateCursor {
    @ApiProperty({
        required: false,
        example: '2025-07-25T12:34:56.000Z',
        description: '생성일자 기준(ISO 8301 형식)',
    })
    @IsOptional()
    @IsISODateString()
    cursor?: string;
}
