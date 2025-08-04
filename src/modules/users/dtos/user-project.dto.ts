import { Project } from 'src/modules/projects/entities/projects.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
export class UserProjectResponseDto {
    @ApiProperty({
        example: 1,
        description: '프로젝트 id',
    })
    @IsNumber()
    id: number;
    @ApiProperty({
        example: '내 프로젝트',
        description: '프로젝트 이름',
    })
    @IsString()
    name: string;
    @ApiProperty({
        example: '백엔드 리드',
        description: '프로젝트 내 역할',
    })
    @IsString()
    role: string;

    static fromEntity(entity: { project: Project; role: string }): UserProjectResponseDto {
        const dto = new UserProjectResponseDto();
        dto.id = entity.project.id;
        dto.name = entity.project.name;
        dto.role = entity.role;
        return dto;
    }
}
