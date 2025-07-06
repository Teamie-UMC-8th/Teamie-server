import { BaseEntity } from "src/common/entities/base.entity";
import { Project } from "src/modules/projects/projects.entity";
import { User } from "src/modules/users/users.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class ProjectFile extends BaseEntity{
    @Column()
    fileUrl: string;

    @ManyToOne(() => User, (user) => user.projectFiles, {onDelete: 'CASCADE'})
    user: User;

    @ManyToOne(() => Project, (project) => project.projectFiles, {onDelete: 'CASCADE'})
    project: Project;
}