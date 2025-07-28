import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { IsISODateString } from 'src/common/decorators/validate-iso-date.decorator';
import { Plan } from '../plans.entity';

export class CreatePlanReq {
    @ApiProperty({
        example: 123,
        description: '프로젝트의 식별자',
    })
    @IsNumber()
    projectId: number;

    @ApiProperty({
        example: '2025-06-18T10:00:00Z',
        description: '일정 생성일',
    })
    @IsISODateString()
    date: string;
}

export class CreatePlanResponse {
    @ApiProperty({
        example: 123,
        description: '일정의 식별자',
    })
    planId: number;

    @ApiProperty({
        example: '2025-06-18T10:00:00Z',
        description: '일정 날짜',
    })
    date: string;

    static fromEntity(entity: Plan): CreatePlanResponse {
        const dto = new CreatePlanResponse();
        dto.planId = entity.id;
        dto.date = entity.date.toISOString();
        return dto;
    }
}
