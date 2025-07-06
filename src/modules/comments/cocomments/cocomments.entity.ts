import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { Comment } from "../comments.entity";

@Entity()
export class Cocomment extends BaseEntity {
    @Column({ length: 500 })
    content: string;

    @ManyToOne(() => Comment, (comment) => comment.cocomments, {onDelete: 'CASCADE'})
    comment: Comment;
}