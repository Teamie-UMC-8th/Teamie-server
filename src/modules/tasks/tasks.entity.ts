import { Status } from "src/common/enums/status.enum";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Project } from "../projects/projects.entity";
import { Comment } from "../comments/comments.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { Manager } from "../mappings/managers/managers.entity";
import { TaskFile } from "../mappings/taskFiles/taskFiles.entity";

@Entity()
export class Task extends BaseEntity{
    @Column()
    name: string;

    @Column()
    deadline: Date;

    @Column({
        type: 'enum',
        enum: Status,
        default: Status.NOTSTART,
    })
    status: Status

    @Column()
    step: number;

    @Column()
    memo: string;   //비고

    @ManyToOne(() => Project, (project) => project.tasks, {onDelete: 'CASCADE'})
    project: Project;

    @OneToMany(() => Comment, (comment) => comment.task)
    comments: Comment[];

    @OneToMany(() => Manager, (manager) => manager.task)
    managers: Manager[];

    @OneToMany(() => TaskFile, (taskFile) => taskFile.task)
    taskFiles: TaskFile[];
}