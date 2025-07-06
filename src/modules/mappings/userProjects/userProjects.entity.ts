import { BaseEntity } from "src/common/entities/base.entity";
import { TeamRole } from "src/common/enums/role.enum";
import { Project } from "src/modules/projects/projects.entity";
import { User } from "src/modules/users/users.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class UserProject extends BaseEntity{
    @Column({
        type: 'enum',
        enum: TeamRole,
        default: TeamRole.MEMBER,
    })
    role: TeamRole

    @ManyToOne(() => User, (user) => user.userProjects, {onDelete: 'CASCADE'})
    user: User;

    @ManyToOne(() => Project, (project) => project.userProjects, {onDelete: 'CASCADE'})
    project: Project;
}