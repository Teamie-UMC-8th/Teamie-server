import { Status } from "src/common/enums/status.enum";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { Project } from "../projects/projects.entity";
import { Comment } from "../comments/comments.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { Manager } from "../mappings/managers/managers.entity";
import { TaskFile } from "../mappings/taskFiles/taskFiles.entity";
import { Step } from "../steps/steps.entity";

@Entity()
export class Task extends BaseEntity{
    @Column({ length: 35, default: '빈 업무' })
    name: string;

    @Column()
    deadline: Date;

    
    @Column({
        type: 'enum',
        enum: Status,
        default: Status.NOTSTART,
    })
    status: Status;   

    @Column()
    memo: string;

    @ManyToOne(() => Step, (step) => step.tasks, {onDelete: 'CASCADE'})
    step: Step;

    @OneToMany(() => Comment, (comment) => comment.task)
    comments: Comment[];

    @OneToMany(() => Manager, (manager) => manager.task)
    managers: Manager[];

    @OneToMany(() => TaskFile, (taskFile) => taskFile.task)
    taskFiles: TaskFile[];
}