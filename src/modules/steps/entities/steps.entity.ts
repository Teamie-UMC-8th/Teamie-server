import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Project } from '../../projects/entities/projects.entity';
import { Task } from '../../tasks/entities/tasks.entity';

@Entity()
export class Step extends BaseEntity {
    @Column({ length: 20 })
    name: string;

    @ManyToOne(() => Project, (project) => project.steps, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'projectId' })
    project: Project;

    @OneToMany(() => Task, (task) => task.step)
    tasks: Task[];
}
