import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCompanyInsightDto {
    @ApiProperty({
        example: '이 기업은 글로벌 시장에서 선도적인 기술을 보유하고 있습니다.',
        description: '기업 분석 정보',
    })
    @IsNotEmpty({ message: 'companyInsight는 필수 입력값입니다.' })
    @IsString({ message: 'companyInsight는 문자열이어야 합니다.' })
    companyInsight: string;
}
