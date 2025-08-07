import { IsOptional, IsEnum, IsArray, IsISO8601 } from 'class-validator';
import { Transform as ToArray, Type } from 'class-transformer';
import { Status } from 'src/common/enums/status.enum';
import { ApiProperty } from '@nestjs/swagger';

export class GetSearchTaskDto {
    /** 다중 선택된 상태들 (예: ['NOTSTART','INPROGRESS']) */
    @ApiProperty({
        description: '검색할 진행 상태 배열',
        enum: Status,
        isArray: true,
        example: [Status.NOTSTART, Status.ONGOING],
        required: false,
    })
    @ToArray(
        ({ value }) => {
            if (value === undefined || value === '' || value === null) return undefined;
            return Array.isArray(value) ? value : [value];
        },
        { toClassOnly: true }
    )
    @IsOptional()
    @IsArray()
    @IsEnum(Status, { each: true })
    statuses?: Status[];

    /** 다중 선택된 담당자 ID들 */
    @ApiProperty({
        description: '검색할 담당자 ID 배열',
        type: [Number],
        example: [1, 2, 3],
        required: false,
    })
    @ToArray(
        ({ value }) => {
            if (value === undefined || value === '' || value === null) return undefined;
            return Array.isArray(value) ? value : [value];
        },
        { toClassOnly: true }
    )
    @IsOptional()
    @IsArray()
    @Type(() => Number)
    managerIds?: number[];

    /** yyyy-MM-dd, 체크박스 “이전”일 때 */
    @ApiProperty({
        description: '마감일이 지정일 이전인 업무 조회',
        example: '2025-08-10',
        required: false,
    })
    @IsOptional()
    @IsISO8601()
    dateBefore?: string;

    /** yyyy-MM-dd, 체크박스 “이후”일 때 */
    @ApiProperty({
        description: '마감일이 지정일 이후인 업무 조회',
        example: '2025-08-01',
        required: false,
    })
    @IsOptional()
    @IsISO8601()
    dateAfter?: string;
}
