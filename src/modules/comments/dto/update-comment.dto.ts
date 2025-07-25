import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Comment } from '../comments.entity';
export class UpdateCommentRequestDto {
    @ApiProperty({
        example: '업무 기한 다음주로 바꿔야할 것 같아요',
        description: '수정할 글 내용',
    })
    @IsNotEmpty()
    content: string;
}

export class UpdateCommentResponseDto {
    @ApiProperty({
        example: '업무 기한 다음주로 바꿔야할 것 같아요',
        description: '댓글 내용',
    })
    @IsNotEmpty()
    content: string;

    static from(comment: Comment): UpdateCommentResponseDto {
        const dto = new UpdateCommentResponseDto();
        dto.content = comment.content;
        return dto;
    }
}
