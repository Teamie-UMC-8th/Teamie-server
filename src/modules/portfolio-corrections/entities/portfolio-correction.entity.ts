import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/modules/users/entities/users.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { AICorrection } from './ai-correction.entity';
import { RAGData } from './rag-data.entity';
import { PortfolioCorrectionStatus } from 'src/common/enums/portfolio-correction-status.enum';

@Entity()
export class PortfolioCorrection extends BaseEntity {
    @Column({ length: 20, default: '새로운 첨삭 A' })
    title: string;

    @Column({ length: 20 })
    submissionTarget: string;

    @Column({ length: 50 })
    jobTitle: string;

    @Column({ length: 7000, nullable: true })
    companyInsight: string;

    @Column({ length: 3000 })
    jd: string;

    @Column({
        type: 'enum',
        enum: PortfolioCorrectionStatus,
        default: PortfolioCorrectionStatus.NOT_STARTED,
    })
    status: PortfolioCorrectionStatus;

    @ManyToOne(() => User, (user) => user.portfolioCorrections, {
        onDelete: 'CASCADE',
    })
    user: User;

    @OneToMany(() => AICorrection, (aiCorrection) => aiCorrection.portfolioCorrection)
    aiCorrection: AICorrection;

    @OneToMany(() => RAGData, (ragData) => ragData.portfolioCorrection)
    ragData: RAGData;
}
