import { ApiProperty } from '@nestjs/swagger';
import { TaskFile } from '../task-files.entity';
export class TaskFileResponseDto {
    @ApiProperty({
        example: 'https://s3.amazonaws.com/bucket/file.jpg',
        description: '파일 URL',
    })
    fileUrl: string;
}

export class CreateTaskFileResponseDto {
    @ApiProperty({ example: 1, description: '파일 ID' })
    id: number;

    @ApiProperty({ example: 'https://s3.amazonaws.com/...', description: '파일 URL' })
    fileUrl: string;

    static fromEntity(entity: TaskFile): CreateTaskFileResponseDto {
        const dto = new CreateTaskFileResponseDto();
        dto.id = entity.id;
        dto.fileUrl = entity.fileUrl;
        return dto;
    }
}
