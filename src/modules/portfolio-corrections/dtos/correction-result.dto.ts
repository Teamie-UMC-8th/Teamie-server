import { ApiProperty } from '@nestjs/swagger';

export class CorrectionLineDto {
    @ApiProperty({ example: 'detailInfo_1' })
    lineNumber: string;

    @ApiProperty({
        example: '- 동아리 회원 간 언어 교환을 통한 실질적 관계 형성 및 학습 환경 조성',
    })
    originalContent: string;

    @ApiProperty({ example: 1 })
    type: number;

    @ApiProperty({
        example: '글로벌 MD 직무와 직접적인 관련성이 낮은 일반적인 동아리 활동 내용입니다. ...',
    })
    reviewComment: string;

    static from(data: any): CorrectionLineDto {
        const dto = new CorrectionLineDto();
        dto.lineNumber = data.lineNumber;
        dto.originalContent = data.originalContent;
        dto.type = data.type;
        dto.reviewComment = data.reviewComment;
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
    fieldSummary: string;

    static from(data: any): CorrectionFieldDto {
        const dto = new CorrectionFieldDto();
        dto.lines = data.lines.map((line: any) => CorrectionLineDto.from(line));
        dto.fieldSummary = data.fieldSummary;
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
    correction: CorrectionDto;

    static from(data: any): CorrectionResultDto {
        const dto = new CorrectionResultDto();
        dto.projectId = data.projectId;
        dto.projectName = data.projectName;
        dto.correction = CorrectionDto.from(data.correction);
        return dto;
    }
}
