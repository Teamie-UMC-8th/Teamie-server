import { BaseEntity } from 'src/common/entities/base.entity';
import { Task } from 'src/modules/tasks/entities/tasks.entity';
import { User } from 'src/modules/users/entities/users.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class TaskFile extends BaseEntity {
    @Column({ length: 255 })
    fileUrl: string;

    @Column({ length: 255 })
    name: string;

    @ManyToOne(() => Task, (task) => task.taskFiles, { onDelete: 'CASCADE' })
    task: Task;

    @ManyToOne(() => User, (user) => user.taskFiles, { onDelete: 'CASCADE' })
    user: User;
}
