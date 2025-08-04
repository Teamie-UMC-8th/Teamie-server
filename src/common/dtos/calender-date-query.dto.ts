import { ApiProperty } from '@nestjs/swagger';
import { IsISODateString } from '../decorators/validate-iso-date.decorator';

export class CalenderQueryDto {
    @ApiProperty({
        example: '2025-08-01T10:00:00.000Z',
        description: '캘린더 시작 날짜(ISO 8301 형식)',
    })
    @IsISODateString()
    startDate: string;

    @ApiProperty({
        example: '2025-08-30T10:00:00.000Z',
        description: '캘린더 마지막 날짜(ISO 8301 형식)',
    })
    @IsISODateString()
    endDate: string;
}
