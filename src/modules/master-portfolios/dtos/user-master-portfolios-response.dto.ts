import { ApiProperty } from '@nestjs/swagger';
import { portfolioType } from 'src/common/enums/portfolio-type.enum';

export class UserMasterPortfoliosResponseDto {
    @ApiProperty({
        example: 123,
        description: '마스터 포트폴리오 id',
    })
    portfolioId: number;

    @ApiProperty({
        example: '프로젝트A',
        description: '프로젝트 이름',
    })
    projectName: string;

    @ApiProperty({
        example: portfolioType.COURSE,
        description: '마스터 포트폴리오의 카테고리',
    })
    category: portfolioType;

    @ApiProperty({
        example: 74,
        description: '프로젝트에서의 본인의 기여도',
    })
    contributionRate: number;

    @ApiProperty({
        example: '2025-04-18T10:00:00Z',
        description: '프로젝트 생성 일자',
    })
    startDate: string;

    @ApiProperty({
        example: '2025-06-18T10:00:00Z',
        description: '프로젝트 종료 일자',
    })
    endDate: string;

    @ApiProperty({
        example: '카드뉴스 기획 및 제작',
        description: '프로젝트에서 사용자가 맡은 주요업무',
    })
    mainTask: string;

    static fromEntity(entity: {
        id: number;
        name: string;
        category: portfolioType;
        contributionRate: number;
        createdAt: Date;
        completedAt: Date;
        mainTask: string;
    }) {
        const dto = new UserMasterPortfoliosResponseDto();
        dto.portfolioId = entity.id;
        dto.projectName = entity.name;
        dto.category = entity.category;
        dto.contributionRate = entity.contributionRate;
        dto.startDate = entity.createdAt.toISOString();
        dto.endDate = entity.completedAt.toISOString();
        dto.mainTask = entity.mainTask;
        return dto;
    }
}
