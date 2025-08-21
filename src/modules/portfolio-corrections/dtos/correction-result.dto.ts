import { ApiProperty } from '@nestjs/swagger';
import { IsDate } from 'class-validator';
import { portfolioType } from 'src/common/enums/portfolio-type.enum';

export class CorrectionLineDto {
    @ApiProperty({ example: 'detailInfo_1' })
    line_number: string;

    @ApiProperty({
        example: '- 동아리 회원 간 언어 교환을 통한 실질적 관계 형성 및 학습 환경 조성',
    })
    original_content: string;

    @ApiProperty({ example: 1 })
    type: number;

    @ApiProperty({
        example: '글로벌 MD 직무와 직접적인 관련성이 낮은 일반적인 동아리 활동 내용입니다. ...',
    })
    review_comment: string;

    static from(data: any): CorrectionLineDto {
        const dto = new CorrectionLineDto();
        dto.line_number = data.line_number;
        dto.original_content = data.original_content;
        dto.type = data.type;
        dto.review_comment = data.review_comment;
        return dto;
    }
}

export class CorrectionFieldDto {
    @ApiProperty({ type: [CorrectionLineDto] })
    lines: CorrectionLineDto[];

    @ApiProperty({
        example:
            '프로젝트 배경은 동아리 활동에 대한 설명으로, 글로벌 MD 직무와의 직접적인 연관성은 낮습니다. ...',
    })
    field_summary: string;

    static from(data: any): CorrectionFieldDto {
        const dto = new CorrectionFieldDto();
        dto.lines = data.lines.map((line: any) => CorrectionLineDto.from(line));
        dto.field_summary = data.field_summary;
        return dto;
    }
}

export class CorrectionDto {
    @ApiProperty({ type: CorrectionFieldDto })
    detailInfo: CorrectionFieldDto;

    @ApiProperty({ type: CorrectionFieldDto })
    assignedTasks: CorrectionFieldDto;

    @ApiProperty({ type: CorrectionFieldDto })
    keyAchievements: CorrectionFieldDto;

    @ApiProperty({ type: CorrectionFieldDto })
    insights: CorrectionFieldDto;

    static from(data: any): CorrectionDto {
        const dto = new CorrectionDto();
        dto.detailInfo = CorrectionFieldDto.from(data.detailInfo);
        dto.assignedTasks = CorrectionFieldDto.from(data.assignedTasks);
        dto.keyAchievements = CorrectionFieldDto.from(data.keyAchievements);
        dto.insights = CorrectionFieldDto.from(data.insights);
        return dto;
    }
}

export class CorrectionResultDto {
    @ApiProperty({ example: 6 })
    projectId: number;

    @ApiProperty({ example: '나의 테스트 프로젝트' })
    projectName: string;

    @ApiProperty({ type: CorrectionDto })
    correctionResult: CorrectionDto;

    @ApiProperty({
        description: '프로젝트에 대한 기여도 (0-100)',
        example: 50,
    })
    contributionRate: number;

    @ApiProperty({
        description: '포트폴리오 유형',
        example: portfolioType.OTHER,
        enum: portfolioType,
    })
    category: portfolioType;

    @ApiProperty({
        example: '2025-07-14T20:35:00.000Z',
        description: '프로젝트 생성일자',
    })
    @IsDate()
    createdAt: Date;

    @ApiProperty({
        example: '2025-07-14T20:35:00.000Z',
        description: '프로젝트 완료 시각',
        nullable: true,
    })
    @IsDate()
    completedAt: Date | null;

    static from(data: any): CorrectionResultDto {
        const dto = new CorrectionResultDto();
        dto.projectId = data.projectId;
        dto.projectName = data.projectName;
        dto.contributionRate = data.contributionRate;
        dto.category = data.category;
        dto.correctionResult = CorrectionDto.from(data.correctionResult);
        dto.createdAt = data.createdAt;
        dto.completedAt = data.completedAt;
        return dto;
    }
}

export class GetCorrectionResultDto {
    @ApiProperty({
        example: [
            { id: 1, name: '나의 테스트 프로젝트' },
            { id: 2, name: '나의 두 번째 프로젝트' },
        ],
    })
    projects: { id: number; name: string }[];

    @ApiProperty({ type: CorrectionResultDto })
    firstCorrection: CorrectionResultDto;

    static from(data: any): GetCorrectionResultDto {
        const dto = new GetCorrectionResultDto();
        dto.projects = data.projects.map((project: any) => ({
            id: project.id,
            name: project.name,
        }));
        dto.firstCorrection = CorrectionResultDto.from(data.firstCorrection);
        return dto;
    }
}
