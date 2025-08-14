import { Comment } from '../entities/comments.entity';
import { User } from 'src/modules/users/entities/users.entity';
import { UserProfile } from 'src/common/dtos/user-profile.dto';

/** 생성 이벤트용 DTO */
export class CreatedCommentDTO {
    id: number;
    content: string;
    user: UserProfile;

    static from(comment: Comment): CreatedCommentDTO {
        const dto = new CreatedCommentDTO();
        dto.id = comment.id;
        dto.content = comment.content;
        dto.user = UserProfile.from(comment.user as User);
        return dto;
    }
}

/** 업데이트 이벤트용 DTO */
export class UpdatedCommentDTO {
    id: number;
    content: string;

    static from(comment: Comment): UpdatedCommentDTO {
        const dto = new UpdatedCommentDTO();
        dto.id = comment.id;
        dto.content = comment.content;
        return dto;
    }
}
