import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../users/entities/users.entity';
import { PortfolioAIResult } from './portfolioAIResult/portfolioAIResults.entity';
import { ApplicationType } from 'src/common/enums/applicationType.enum';

@Entity()
export class FinalPortfolio extends BaseEntity {
    @Column({ length: 20 })
    title: string;

    @Column({ length: 20 })
    submissionTarget: string;

    @Column({
        type: 'enum',
        enum: ApplicationType,
        default: ApplicationType.INTERN,
    })
    applicationType: ApplicationType;

    @Column({ length: 15 })
    jobTitle: string;

    @Column({ length: 80 })
    highlight: string;

    @Column({ length: 400 })
    companyInsight: string;

    @Column({ length: 500 })
    jd: string;

    @ManyToOne(() => User, (user) => user.finalPortfolios, {
        onDelete: 'CASCADE',
    })
    user: User;

    @OneToMany(() => PortfolioAIResult, (result) => result.finalPortfolio)
    results: PortfolioAIResult[];
}
