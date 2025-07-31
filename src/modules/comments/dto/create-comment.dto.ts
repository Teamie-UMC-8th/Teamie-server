import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Comment } from '../comments.entity';
export class CreateCommentRequestDto {
    @ApiProperty({
        example: '업무 기한 다음주로 바꿔야할 것 같아요',
        description: '댓글 내용',
    })
    @IsNotEmpty()
    content: string;
}

export class CreateCommentResponseDto {
    @ApiProperty({
        example: 1,
        description: '댓글 ID',
    })
    commentId: number;

    @ApiProperty({
        example: '업무 기한 다음주로 바꿔야할 것 같아요',
        description: '댓글 내용',
    })
    @IsNotEmpty()
    content: string;

    static from(comment: Comment): CreateCommentResponseDto {
        const dto = new CreateCommentResponseDto();
        dto.commentId = comment.id;
        dto.content = comment.content;
        return dto;
    }
}
