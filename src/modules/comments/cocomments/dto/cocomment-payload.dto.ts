import { Cocomment } from '../entities/cocomments.entity';
import { User } from 'src/modules/users/entities/users.entity';
import { UserProfile } from 'src/common/dtos/user-profile.dto';

/** 생성 이벤트용 DTO */
export class CreatedCocommentDTO {
    id: number;
    content: string;
    user: UserProfile;

    static from(cocomment: Cocomment): CreatedCocommentDTO {
        const dto = new CreatedCocommentDTO();
        dto.id = cocomment.id;
        dto.content = cocomment.content;
        dto.user = UserProfile.from(cocomment.user as User);
        return dto;
    }
}

/** 업데이트 이벤트용 DTO */
export class UpdatedCocommentDTO {
    id: number;
    content: string;

    static from(cocomment: Cocomment): UpdatedCocommentDTO {
        const dto = new UpdatedCocommentDTO();
        dto.id = cocomment.id;
        dto.content = cocomment.content;
        return dto;
    }
}
