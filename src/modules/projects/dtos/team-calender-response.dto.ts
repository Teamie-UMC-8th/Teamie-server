import { ApiProperty } from '@nestjs/swagger';
import { CalenderCardType } from 'src/common/enums/calender-card-type.enum';

export class TeamCalenderResponseDto {
    @ApiProperty({
        example: '2025-08-01T10:00:00Z',
        description: '캘린더 날짜/ISO8601 형식',
    })
    date: string;

    @ApiProperty({
        isArray: true,
        description: '날짜 별 캘린더 카드 리스트',
    })
    list: CalenderCardResponseDto[];

    static fromEntity(entity: {
        date: string;
        list: CalenderCardResponseDto[];
    }): TeamCalenderResponseDto {
        const dto = new TeamCalenderResponseDto();
        dto.date = entity.date;
        dto.list = entity.list;
        return dto;
    }
}

export class CalenderCardResponseDto {
    @ApiProperty({
        example: 123,
        description: '업무 식별자 또는 일정 식별자',
    })
    id: number;

    @ApiProperty({
        example: '업무 C 마감',
        description: '업무명 또는 일정명',
    })
    name: string;

    @ApiProperty({
        example: CalenderCardType.TASK,
        description: 'TASK OR PLAN',
    })
    type: CalenderCardType;

    static fromPlan(entity: { id: number; name: string }): CalenderCardResponseDto {
        const dto = new CalenderCardResponseDto();
        dto.id = entity.id;
        dto.name = entity.name;
        dto.type = CalenderCardType.PLAN;
        return dto;
    }

    static fromTask(entity: { id: number; name: string }): CalenderCardResponseDto {
        const dto = new CalenderCardResponseDto();
        dto.id = entity.id;
        dto.name = entity.name;
        dto.type = CalenderCardType.TASK;
        return dto;
    }
}
