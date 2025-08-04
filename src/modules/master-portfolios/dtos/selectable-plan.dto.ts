import { ApiProperty } from '@nestjs/swagger';
import { Plan } from 'src/modules/plans/entities/plan.entity';

export class SelectablePlanResponseDto {
    @ApiProperty({ description: '일정 ID', type: Number, example: 1 })
    id: number;
    @ApiProperty({ description: '일정 이름', type: String, example: '회의 이름1' })
    name: string;
    @ApiProperty({ description: '일정 날짜', type: Date, example: '2025-08-18T10:00:00.000Z' })
    date: Date;
    @ApiProperty({ description: '회의록', type: String, example: '회의록 내용' })
    meetingRecords: string;

    static fromEntity(entity: Plan): SelectablePlanResponseDto {
        const dto = new SelectablePlanResponseDto();
        dto.id = entity.id;
        dto.name = entity.name;
        dto.date = entity.date;
        dto.meetingRecords = entity.meetingRecords;
        return dto;
    }
}
