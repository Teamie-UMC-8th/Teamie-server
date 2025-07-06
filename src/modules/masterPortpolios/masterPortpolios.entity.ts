import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { User } from "../users/users.entity";
import { Project } from "../projects/projects.entity";

@Entity()
export class MasterPortpolio extends BaseEntity{
    @Column()
    detail: string;

    @Column()
    responsibilites: string;

    @Column()
    achivements: string;

    @Column()
    insights: string;

    @Column()
    contributionRatio: number;

    @Column()
    mainTask: string;

    @Column()
    tags: string;   // NOTE : 각 태그 내용이 확정되면 ENUM으로 변경.

    @ManyToOne(() => User, (user) => user.masterPPs, {onDelete:'CASCADE'})
    user: User;

    @ManyToOne(() => Project, (project) => project.masterPPs, {onDelete: 'CASCADE'})
    project: Project;
}