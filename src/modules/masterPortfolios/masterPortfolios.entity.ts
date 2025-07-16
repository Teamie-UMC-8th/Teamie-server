import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { User } from '../users/entities/users.entity';
import { Project } from '../projects/entities/projects.entity';
import { portfolioType } from 'src/common/enums/portfolioType.enum';

@Entity()
export class MasterPortfolio extends BaseEntity {
    @Column({ length: 2000 })
    detailInfo: string;

    @Column({ length: 2000 })
    assignedTask: string;

    @Column({ length: 2000 })
    keyAchievement: string;

    @Column({ length: 2000 })
    insight: string;

    @Column()
    contributionRate: number;

    @Column({ length: 24 })
    mainTask: string;

    @Column({
        type: 'enum',
        enum: portfolioType,
        default: portfolioType.OTHER,
    })
    category: portfolioType;

    @ManyToOne(() => User, (user) => user.masterPFs, { onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Project, (project) => project.masterPFs, {
        onDelete: 'CASCADE',
    })
    project: Project;
}
