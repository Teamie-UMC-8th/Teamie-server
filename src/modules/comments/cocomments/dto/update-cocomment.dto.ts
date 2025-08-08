import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Cocomment } from '../entities/cocomments.entity';
export class UpdateCocommentRequestDto {
    @ApiProperty({
        example: '업무 기한 다음주로 바꿔야할 것 같아요',
        description: '수정할 글 내용',
    })
    @IsNotEmpty()
    content: string;
}

export class UpdateCocommentResponseDto {
    @ApiProperty({
        example: 1,
        description: '대댓글 ID',
    })
    cocommentId: number;

    @ApiProperty({
        example: '업무 기한 다음주로 바꿔야할 것 같아요',
        description: '댓글 내용',
    })
    @IsNotEmpty()
    content: string;

    static from(cocomment: Cocomment): UpdateCocommentResponseDto {
        const dto = new UpdateCocommentResponseDto();
        dto.cocommentId = cocomment.id;
        dto.content = cocomment.content;
        return dto;
    }
}
