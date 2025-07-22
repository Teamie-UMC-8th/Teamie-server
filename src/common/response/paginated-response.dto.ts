import { ApiProperty } from '@nestjs/swagger';

export class PageInfoDto {
    @ApiProperty({ nullable: true })
    nextCursor: string | null;

    @ApiProperty({ example: true })
    hasNextPage: boolean;
}

export class PaginatedResponseDto<T> {
    @ApiProperty({ isArray: true })
    data: T[];

    @ApiProperty({ type: PageInfoDto })
    pageInfo: PageInfoDto;

    private constructor(data: T[], nextCursor: string | null, hasNextPage: boolean) {
        this.data = data;
        this.pageInfo = new PageInfoDto();
        this.pageInfo.nextCursor = nextCursor;
        this.pageInfo.hasNextPage = hasNextPage;
    }

    static of<T>(
        data: T[],
        nextCursor: string | null,
        hasNextPage: boolean
    ): PaginatedResponseDto<T> {
        return new PaginatedResponseDto(data, nextCursor, hasNextPage);
    }
}
