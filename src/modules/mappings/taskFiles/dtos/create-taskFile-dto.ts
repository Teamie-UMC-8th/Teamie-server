import { ApiProperty } from '@nestjs/swagger';

export class TaskFileResponseDto {
    @ApiProperty({
        example: 'https://s3.amazonaws.com/bucket/file.jpg',
        description: '파일 URL',
    })
    fileUrl: string;
}
