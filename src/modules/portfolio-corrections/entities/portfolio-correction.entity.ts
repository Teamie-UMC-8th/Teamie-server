import { BaseEntity } from 'src/common/entities/base.entity';
import { ApplicationType } from 'src/common/enums/application-type.enum';
import { User } from 'src/modules/users/entities/users.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { AICorrection } from './ai-correction.entity';

@Entity()
export class PortfolioCorrection extends BaseEntity {
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
    applicationType: string;

    @Column({ length: 15 })
    jobTitle: string;

    @Column({ length: 400, select: false })
    companyInsight: string;

    @Column({ length: 500, select: false })
    jd: string;

    @ManyToOne(() => User, (user) => user.portfolioCorrections, {
        onDelete: 'CASCADE',
    })
    user: User;

    @OneToMany(() => AICorrection, (aiCorrection) => aiCorrection.portfolioCorrection)
    aiCorrection: AICorrection;
}
