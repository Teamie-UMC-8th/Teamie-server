import { ApiProperty } from '@nestjs/swagger';

export class OutputItemDto {
    @ApiProperty({ enum: ['line', 'header'], example: 'line' })
    type: 'line' | 'header';

    @ApiProperty({ required: false, example: 1 })
    number?: number;

    @ApiProperty({ example: '텍스트 내용' })
    text: string;
}

export class MasterPortfolioOutputDto {
    @ApiProperty({
        type: OutputItemDto,
        isArray: true,
        example: [
            {
                type: 'line',
                number: 1,
                text: '언어 학습의 한계를 넘어 실제적 표현과 문화 이해를 돕는 교류 환경 조성 목표',
            },
            {
                type: 'line',
                number: 2,
                text: '총 9명의 운영진(회장단 2, 기획국 3, 홍보국 2, 대외협력국 2)이 1년간 협업하여 운영',
            },
            {
                type: 'line',
                number: 3,
                text: '대상: 언어 교환 및 문화 교류에 관심 있는 동아리 회원',
            },
            {
                type: 'line',
                number: 4,
                text: '구글 폼, 구글 시트 등을 활용하여 참가자 수요 기반의 맞춤형 프로그램 기획 및 운영',
            },
            {
                type: 'line',
                number: 5,
                text: '정기적인 피드백 수집 및 분석을 통해 차기 활동에 반영하는 데이터 기반 개선 루프 구축',
            },
        ],
    })
    detailInfo: OutputItemDto[];

    @ApiProperty({
        type: OutputItemDto,
        isArray: true,
        example: [
            { type: 'header', text: '[동아리 운영 기획 총괄]' },
            {
                type: 'line',
                number: 1,
                text: '연간 활동계획 및 예산안 수립, 상반기 결산 보고 및 최종 운영보고 진행',
            },
            {
                type: 'line',
                number: 2,
                text: '정기모임(월 1회) 및 특별행사(분기 1회)의 전체 예산 관리 및 회계 처리 총괄',
            },
            { type: 'header', text: '[정기/특별 행사 기획 및 실행]' },
            {
                type: 'line',
                number: 3,
                text: "'나의 언어 취향 찾기', '언어 교환 X 퀴즈의 밤' 등 회차별 테마 및 콘텐츠 기획",
            },
            {
                type: 'line',
                number: 4,
                text: '참여자 만족도 극대화를 위한 프로그램 상세 설계 (활동지, 아이스브레이킹, BGM 등)',
            },
        ],
    })
    assignedTask: OutputItemDto[];

    @ApiProperty({
        type: OutputItemDto,
        isArray: true,
        example: [
            { type: 'line', number: 1, text: '평균 행사 참여율 전년 대비 104.2% 달성' },
            {
                type: 'line',
                number: 2,
                text: '동아리 회원 유지율 27.1% 달성 (목표치 25% 초과 달성)',
            },
            {
                type: 'line',
                number: 3,
                text: "행사 참여자 대상 설문조사 '매우 만족' 응답 비율 63.7% 확보",
            },
        ],
    })
    keyAchievement: OutputItemDto[];

    @ApiProperty({
        type: OutputItemDto,
        isArray: true,
        example: [
            {
                type: 'line',
                number: 1,
                text: "예상치 못한 변수에 대응하기 위해 '플랜 B'를 사전에 준비하는 시스템을 구축하고, 인원 변동 등 리스크를 미리 시뮬레이션하며 위기관리 능력을 길렀다.",
            },
            {
                type: 'line',
                number: 2,
                text: "성공적인 기획은 정교한 콘텐츠뿐만 아니라, 참여자 간의 관계와 현장의 분위기, 즉 '관계의 리듬'을 설계하는 것에서 비롯된다는 점을 깨달았다.",
            },
            {
                type: 'line',
                number: 3,
                text: "동아리 활동 경험을 바탕으로, 앞으로 어떤 조직에서든 구성원의 장점을 살리고 편안한 협업 분위기를 조성하는 '사람 중심'의 운영 방식을 적용해 나가겠다.",
            },
        ],
    })
    insight: OutputItemDto[];

    static from(dto: any): MasterPortfolioOutputDto {
        const output = new MasterPortfolioOutputDto();
        output.detailInfo = dto.detailInfo;
        output.assignedTask = dto.assignedTask;
        output.keyAchievement = dto.keyAchievement;
        output.insight = dto.insight;
        return output;
    }
}
