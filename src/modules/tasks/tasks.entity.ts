import { Status } from 'src/common/enums/status.enum';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { Comment } from '../comments/comments.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Manager } from '../mappings/managers/managers.entity';
import { TaskFile } from '../mappings/task-files/task-files.entity';
import { Step } from '../steps/entities/steps.entity';

@Entity()
export class Task extends BaseEntity {
    @Column({ length: 35, default: '빈 업무' })
    name: string;

    @Column({ type: 'datetime', nullable: true })
    deadline: Date | null;

    @Column({
        type: 'enum',
        enum: Status,
        default: Status.NOTSTART,
    })
    status: Status;

    @Column({ type: 'varchar', length: 500, nullable: true })
    memo: string | null;

    @ManyToOne(() => Step, (step) => step.tasks, { onDelete: 'CASCADE' })
    step: Step;

    @OneToMany(() => Comment, (comment) => comment.task)
    comments: Comment[];

    @OneToMany(() => Manager, (manager) => manager.task)
    managers: Manager[];

    @OneToMany(() => TaskFile, (taskFile) => taskFile.task)
    taskFiles: TaskFile[];
}
