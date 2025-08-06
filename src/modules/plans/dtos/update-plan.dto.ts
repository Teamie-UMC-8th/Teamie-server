import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsISODateString } from 'src/common/decorators/validate-iso-date.decorator';

export class UpdatePlanReqDTO {
    @ApiPropertyOptional({
        example: '일정 C',
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        example: '2025-08-05T10:00:00Z',
    })
    @IsOptional()
    @IsISODateString()
    date: string;

    @ApiPropertyOptional({
        example: '000관 000호',
    })
    @IsOptional()
    @IsString()
    location: string;

    @ApiPropertyOptional({
        example: '18:00',
    })
    @IsOptional()
    @IsString()
    startHour: string;

    @ApiPropertyOptional({
        example: '비고',
        description: '비고란, 기록자만 수정 가능합니다.',
    })
    @IsOptional()
    @IsString()
    memo: string;

    @ApiPropertyOptional({
        example: '회의 목차, 1...',
        description: '회의록, 기록자만 수정 가능합니다.',
    })
    @IsOptional()
    @IsString()
    meetingRecords: string;
}
export class BasicUpdatePlanReqDTO extends PartialType(UpdatePlanReqDTO) {}

export class UpdatePlanUserReqDTO {
    @ApiPropertyOptional({
        isArray: true,
        type: Number,
        example: [1, 2, 3],
        description: '일정의 참석자로 지정할 프로젝트 멤버의 id 리스트',
    })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    attendees?: number[];

    @ApiPropertyOptional({
        isArray: true,
        type: Number,
        example: [1, 2, 3],
        description: '일정의 기록자로 지정할 프로젝트 멤버의 id 리스트',
    })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    writers?: number[];
}
