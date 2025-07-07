import { BaseEntity } from "src/common/entities/base.entity";
import { projectPermission } from "src/common/enums/projectPermission.enum";
import { Project } from "src/modules/projects/projects.entity";
import { User } from "src/modules/users/users.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class UserProject extends BaseEntity{
    @Column({
        type: 'enum',
        enum: projectPermission,
        default: projectPermission.MEMBER,
    })
    permission: projectPermission;

    @Column({ length: 13 })
    role: string;

    @ManyToOne(() => User, (user) => user.userProjects, {onDelete: 'CASCADE'})
    user: User;

    @ManyToOne(() => Project, (project) => project.userProjects, {onDelete: 'CASCADE'})
    project: Project;
}