import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { Project } from '../../projects/entities/projects.entity';
import { Task } from '../../tasks/tasks.entity';

@Entity()
export class Step extends BaseEntity {
    @Column({ length: 20 })
    name: string;

    @Column({ default: false })
    isDeleted: boolean;

    @ManyToOne(() => Project, (project) => project.steps, {
        onDelete: 'CASCADE',
    })
    project: Project;

    @OneToMany(() => Task, (task) => task.step)
    tasks: Task[];

}
