import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePersonalRecallDto {
    @ApiPropertyOptional({
        example: '내가 가장 잘했다고 생각하는 건 ‘전체 흐름을 잡아가는 능력’이었다...',
        description: '질문1에 대한 답변',
    })
    Q1?: string;
    @ApiPropertyOptional({
        example:
            '6월 정기모임 참석률이 예상보다 낮았던 날, 준비한 조별 활동이 어색해져 현장에서 급히 프로그램을 수정해야 했다...',
        description: '질문2에 대한 답변',
    })
    Q2?: string;
    @ApiPropertyOptional({
        example: '강점은 ‘관계의 리듬을 설계하는 감각’과 ‘사람 중심 운영’이다...',
        description: '질문3에 대한 답변',
    })
    Q3?: string;
}
