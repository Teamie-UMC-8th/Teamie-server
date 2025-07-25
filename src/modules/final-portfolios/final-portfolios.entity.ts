import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../users/entities/users.entity';
import { PortfolioAIResult } from './portfolio-ai-result/portfolio-ai-results.entity';
import { ApplicationType } from 'src/common/enums/application-type.enum';

@Entity()
export class FinalPortfolio extends BaseEntity {
    @Column({ length: 20 })
    title: string;

    @Column({ length: 20, select: false })
    submissionTarget: string;

    @Column({
        type: 'enum',
        enum: ApplicationType,
        default: ApplicationType.INTERN,
        select: false,
    })
    applicationType: ApplicationType;

    @Column({ length: 15 })
    jobTitle: string;

    @Column({ length: 80, select: false })
    highlight: string;

    @Column({ length: 400, select: false })
    companyInsight: string;

    @Column({ length: 500, select: false })
    jd: string;

    @ManyToOne(() => User, (user) => user.finalPortfolios, {
        onDelete: 'CASCADE',
    })
    user: User;

    @OneToMany(() => PortfolioAIResult, (result) => result.finalPortfolio)
    results: PortfolioAIResult[];
}
