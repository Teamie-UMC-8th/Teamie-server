import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class RagResponseDto {
    @ApiProperty({
        description: '검색된 키워드 목록',
        example: ['레진코믹스 글로벌 MD', '레진코믹스 해외사업', '레진코믹스 웹툰 IP 유통'],
        isArray: true,
        type: String,
    })
    @IsArray()
    keywords: string[];

    @ApiProperty({
        description: '관련 링크 목록',
        example: [
            'https://kstd-lezhin.career.greetinghr.com/ko/o/143445',
            'https://www.wanted.co.kr/wd/247334',
            'https://dealsitetv.com/articles/51996',
            'https://about.lezhin.com/ko',
        ],
        isArray: true,
        type: String,
    })
    @IsArray()
    links: string[];

    static fromEntity(entity: any): any {
        const dto = new RagResponseDto();
        dto.keywords = entity.keywords;
        dto.links = entity.links;
        return dto;
    }
}
