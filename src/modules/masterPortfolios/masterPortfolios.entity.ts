import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { User } from "../users/users.entity";
import { Project } from "../projects/projects.entity";
import { PortfolioTag } from "src/common/enums/portfolioTag.enum";

@Entity()
export class MasterPortfolio extends BaseEntity{
    @Column({ length: 2000 })
    detail: string;

    @Column({ length: 2000 })
    responsibilites: string;

    @Column({ length: 2000 })
    achivements: string;

    @Column({ length: 2000 })
    insights: string;

    @Column()
    contributionRatio: number;

    @Column({ length: 100 })
    mainTask: string;

    @Column({
        type: 'enum',
        enum: PortfolioTag,
        default: PortfolioTag.OTHER
    })
    tag: PortfolioTag;

    @ManyToOne(() => User, (user) => user.masterPFs, {onDelete:'CASCADE'})
    user: User;

    @ManyToOne(() => Project, (project) => project.masterPFs, {onDelete: 'CASCADE'})
    project: Project;
}