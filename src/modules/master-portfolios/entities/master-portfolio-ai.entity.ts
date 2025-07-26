import { BaseEntity } from 'src/common/entities/base.entity';
import { Project } from 'src/modules/projects/entities/projects.entity';
import { User } from 'src/modules/users/entities/users.entity';
import { Column, Entity, ManyToOne, Unique } from 'typeorm';

@Entity()
@Unique(['user', 'project'])
export class MasterPortfolioAI extends BaseEntity {
    @Column({ length: 2000 })
    detailInfo: string;
    @Column({ length: 2000 })
    assignedTask: string;
    @Column({ length: 2000 })
    keyAchievement: string;
    @Column({ length: 2000 })
    insight: string;
    @ManyToOne(() => User, (user) => user.masterPFs, { onDelete: 'CASCADE' })
    user: User;
    @ManyToOne(() => Project, (project) => project.masterPortfolio, {
        onDelete: 'CASCADE',
    })
    project: Project;
}
