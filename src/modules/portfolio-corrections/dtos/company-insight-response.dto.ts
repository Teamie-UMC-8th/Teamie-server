import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CompanyInsightResponseDto {
    @ApiProperty({
        example:
            '이러한 문화에 적합한 경험이나 역량 (예: 자율성 중시 → 주도적 기획/실행 경험 강조)\n\n### 2. 비전과 사업 방향성\n**목표**: 회사의 미래 계획과 사업 전략을 이해하여 그 방향성에 기여할 수 있는 역량을 파악\n\n**분석 요소**:\n- 회사의 미션, 비전, 핵심 사업 영역\n- 최근 사업 확장, 투자 유치, 신규 서비스 런칭 등의 동향\n- 시장에서의 포지셔닝과 경쟁 전략\n- 중장기 성장 계획과 목표\n\n**도출해야 할 것**: 회사의 성장 방향에 부합하는 경험이나 스킬 (예: 글로벌 확장 계획 → 해외 경험, 어학 능력 강조)\n\n### 3. 강점과 약점 분석',
    })
    @IsString()
    companyInsight: string;

    static fromEntity(entity: any): CompanyInsightResponseDto {
        const dto = new CompanyInsightResponseDto();
        dto.companyInsight = entity.companyInsight;
        return dto;
    }
}
