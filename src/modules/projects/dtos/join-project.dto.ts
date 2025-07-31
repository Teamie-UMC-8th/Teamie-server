import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../entities/projects.entity';
export class JoinProjectDto {
    @ApiProperty()
    projectId: number;
}
export class JoinProjectResponseDto {
    @ApiProperty({ description: '요청 처리 결과 메시지' })
    message: string;
    static fromEntity(message: string): JoinProjectResponseDto {
        const dto = new JoinProjectResponseDto();
        dto.message = message;
        return dto;
    }
}
