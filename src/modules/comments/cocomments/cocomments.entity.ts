import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Comment } from '../comments.entity';
import { User } from '../../users/entities/users.entity';

@Entity()
export class Cocomment extends BaseEntity {
    @Column({ length: 300 })
    content: string;

    @ManyToOne(() => Comment, (comment) => comment.cocomments, {
        onDelete: 'CASCADE',
    })
    comment: Comment;

    @ManyToOne(() => User, (user) => user.cocomments, { onDelete: 'CASCADE' })
    user: User;
}
