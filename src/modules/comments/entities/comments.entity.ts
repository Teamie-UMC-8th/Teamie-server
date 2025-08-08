import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { Task } from '../../tasks/entities/tasks.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Cocomment } from '../cocomments/entities/cocomments.entity';

@Entity()
export class Comment extends BaseEntity {
    @Column({ length: 300 })
    content: string;

    @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Task, (task) => task.comments, { onDelete: 'CASCADE' })
    task: Task;

    @OneToMany(() => Cocomment, (cocomment) => cocomment.comment)
    cocomments: Cocomment[];
}
