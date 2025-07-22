import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { Project } from '../../projects/entities/projects.entity';
import { portfolioType } from 'src/common/enums/portfolio-type.enum';
import { Questions } from './questions.entity';

@Entity()
export class MasterPortfolio extends BaseEntity {
    @Column({ length: 2000, nullable: true })
    detailInfo: string;

    @Column({ length: 2000, nullable: true })
    assignedTask: string;

    @Column({ length: 2000, nullable: true })
    keyAchievement: string;

    @Column({ length: 2000, nullable: true })
    insight: string;

    @Column({ default: 0 })
    contributionRate: number;

    @Column({ length: 24, nullable: true })
    mainTask: string;

    @Column({
        type: 'enum',
        enum: portfolioType,
        default: portfolioType.OTHER,
    })
    category: portfolioType;

    @ManyToOne(() => User, (user) => user.masterPFs, { onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Project, (project) => project.masterPortfolio, {
        onDelete: 'CASCADE',
    })
    project: Project;

    @OneToMany(() => Questions, (questions) => questions.masterPortfolio)
    questions: Questions[];
}
