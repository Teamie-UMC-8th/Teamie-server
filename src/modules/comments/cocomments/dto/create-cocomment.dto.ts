import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Comment } from '../../comments.entity';
import { Cocomment } from '../cocomments.entity';

export class CreateCocommentRequestDto {
    @ApiProperty({
        example: 1,
        description: '대댓글 작성할 댓글 Id',
    })
    @IsNotEmpty()
    commentId: number;

    @ApiProperty({
        example: '업무 기한 다음주로 바꿔야할 것 같아요',
        description: '댓글 내용',
    })
    @IsNotEmpty()
    content: string;
}

export class CreateCocommentResponseDto {
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

    static from(cocomment: Cocomment): CreateCocommentResponseDto {
        const dto = new CreateCocommentResponseDto();
        dto.cocommentId = cocomment.id;
        dto.content = cocomment.content;
        return dto;
    }
}
