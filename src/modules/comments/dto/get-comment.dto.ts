import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Comment } from '../comments.entity';
import { User } from '../../users/entities/users.entity';
import { Cocomment } from '../cocomments/cocomments.entity';

export class UserInCommentDto {
    @ApiProperty({
        example: 'https://s3:example.com/profile/example.png',
        description: '사용자 프로필 이미지 url',
    })
    imageUrl: string;

    @ApiProperty({
        example: '홍길동',
        description: '나의 프로필-이름',
    })
    name: string;

    static from(user: User): UserInCommentDto {
        const dto = new UserInCommentDto();
        dto.imageUrl = user.imageUrl;
        dto.name = user.name;
        return dto;
    }
}

export class CocommentInCommentDto {
    @ApiProperty({
        example: 1,
        description: '대댓글 ID',
    })
    cocommentId: number;

    @ApiProperty({
        example: '업무 기한 다음주로 바꿔야할 것 같아요',
        description: '대댓글 내용',
    })
    @IsNotEmpty()
    content: string;

    @ApiProperty({
        example: 1,
        description: '대댓글 생성된 시간',
    })
    createdAt: Date;

    @ApiProperty({
        example: 1,
        description: '대댓글 수정된 시간',
    })
    updatedAt: Date;

    @ApiProperty({
        type: UserInCommentDto,
        description: '해당 대댓글을 작성한 유저 정보',
    })
    users: UserInCommentDto;

    static from(cocomment: Cocomment): CocommentInCommentDto {
        const dto = new CocommentInCommentDto();
        dto.cocommentId = cocomment.id;
        dto.content = cocomment.content;
        dto.createdAt = cocomment.createdAt;
        dto.updatedAt = cocomment.updatedAt;
        dto.users = UserInCommentDto.from(cocomment.user);
        return dto;
    }
}

export class CommentGroupDto {
    @ApiProperty({
        example: 1,
        description: '댓글 I',
    })
    @IsNotEmpty()
    commentId: number;

    @ApiProperty({
        example: '업무 기한 다음주로 바꿔야할 것 같아요',
        description: '댓글 내용',
    })
    @IsNotEmpty()
    content: string;

    @ApiProperty({
        example: 1,
        description: '댓글 생성된 시간',
    })
    createdAt: Date;

    @ApiProperty({
        example: 1,
        description: '댓글 수정된 시간',
    })
    updatedAt: Date;

    @ApiProperty({
        type: UserInCommentDto,
        description: '해당 댓글을 작성한 유저 정보',
    })
    users: UserInCommentDto;

    @ApiProperty({
        type: [CocommentInCommentDto],
        description: '해당 댓글을 포함된 대댓글 목록',
    })
    cocomments: CocommentInCommentDto[];

    static from(comment: Comment): CommentGroupDto {
        const dto = new CommentGroupDto();
        dto.commentId = comment.id;
        dto.content = comment.content;
        dto.createdAt = comment.createdAt;
        dto.updatedAt = comment.updatedAt;
        dto.users = UserInCommentDto.from(comment.user);
        dto.cocomments = comment.cocomments?.map((c) => CocommentInCommentDto.from(c)) || [];
        return dto;
    }
}

export class GetCommentResponseDto {
    @ApiProperty({
        example: 42,
        description: '댓글 갯수',
    })
    @IsNotEmpty()
    totalCount: number;

    @ApiProperty({
        example: true,
        description: '가져올 댓글이 있는지 여부',
    })
    @IsNotEmpty()
    hasMore: boolean;

    @ApiProperty({
        type: [CommentGroupDto],
        description: '댓글목록',
    })
    comments: CommentGroupDto[];

    static from(
        comments: Comment[],
        totalCount: number,
        offset: number,
        limit: number
    ): GetCommentResponseDto {
        const dto = new GetCommentResponseDto();
        dto.totalCount = totalCount;
        dto.hasMore = offset + limit < totalCount;
        dto.comments = comments.map((comment) => CommentGroupDto.from(comment));
        return dto;
    }
}
