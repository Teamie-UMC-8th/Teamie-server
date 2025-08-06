import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateCorrectionsDto {
    @ApiProperty({
        description: '선택된 프로젝트 ID 목록',
        type: [Number],
        example: [1, 2, 3],
    })
    @IsArray()
    selectedProjects: number[];
}

export class CreatePortfolioCorrectionDto {
    @ApiProperty({
        description: '포트폴리오 첨삭 제목',
        example: '새로운 첨삭 A',
    })
    title: string;

    @ApiProperty({
        description: '제출처',
        example: '레진코믹스',
    })
    @IsNotEmpty()
    @IsString()
    submissionTarget: string;

    @ApiProperty({
        description: '직무명',
        example: '글로벌 MD',
    })
    @IsNotEmpty()
    @IsString()
    jobTitle: string;

    @ApiProperty({
        description: 'Job Description',
        example:
            '담당업무\n- 국내외 MD 유통 업체 관리\n- MD 수출 과정 핸들링\n-> 오더 주문, 수금, 발주, 출고 등 관리\n-> 서류 통관 인허가, 면장 등\n- 공급 매출 정산 업무 (ERP 시스템 판매 정보 및 결산)\n\n자격요건\n- 영어 비즈니스 커뮤니케이션이 가능하신 분\n- K-POP, 웹툰IP의 이해도를 가지고 계신 분\n- 문서 프로그램 엑셀 활용 능력이 높으신 분\n- 대내/외 원활한 소통 능력을 갖추신 분\n\n우대요건\n- 주도적인 목표 수립과 실행력을 보유하신 분\n- 여성향 장르 웹툰에 대한 이해도가 높으신 분\n- 대중적인 트렌드에 민감하고 시장 트렌드 분석이 가능하신 분\n- 팀워크를 중시하며 긍정적인 커뮤니케이션 마인드를 보유하신 분\n- 팬덤 비즈니스에 대한 높은 이해도를 보유하신 분\n- ERP, 상급 수준의 MS Office 활용, 도구 툴 활용이 가능하신 분 (Excel, Power Point 등)\n- 해외 출장 업무에 거부감이 없으신 분',
    })
    @IsNotEmpty()
    @IsString()
    jd: string;
}
