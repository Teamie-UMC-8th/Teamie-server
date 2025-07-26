import { ApiProperty } from '@nestjs/swagger';
import { MasterPortfolioAI } from '../entities/master-portfolio-ai.entity';

export class MasterPortfolioAIResponseDto {
    @ApiProperty({ type: Number, description: '마스터 포트폴리오 AI 생성 결과 ID' })
    id: number;
    @ApiProperty({
        type: String,
        description: '프로젝트에 대한 상세 정보',
        example: '프로젝트에 대한 상세 정보입니다.',
    })
    detailInfo: string;
    @ApiProperty({
        type: String,
        description: '프로젝트에서 담당한 업무',
        example: '프로젝트에서 담당한 업무입니다.',
    })
    assignedTask: string;
    @ApiProperty({
        type: String,
        description: '프로젝트에서 달성한 주요 성과',
        example: '프로젝트에서 달성한 주요 성과입니다.',
    })
    keyAchievement: string;
    @ApiProperty({
        type: String,
        description: '프로젝트에서 배운 점',
        example: '프로젝트에서 배운 점입니다.',
    })
    insight: string;

    static from(data: MasterPortfolioAI): MasterPortfolioAIResponseDto {
        const dto = new MasterPortfolioAIResponseDto();
        dto.id = data.id;
        dto.detailInfo = data.detailInfo;
        dto.assignedTask = data.assignedTask;
        dto.keyAchievement = data.keyAchievement;
        dto.insight = data.insight;

        return dto;
    }
}
