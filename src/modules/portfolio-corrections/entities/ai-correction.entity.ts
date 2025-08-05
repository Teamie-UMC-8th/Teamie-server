import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { PortfolioCorrection } from './portfolio-correction.entity';

@Entity()
export class AICorrection extends BaseEntity {
    @Column({ type: 'json' })
    correctionResult: any;

    @Column()
    projectId: number;

    @Column()
    modelName: string;

    @Column({ type: 'float', default: 0.3 })
    llmTemperature: number;

    @JoinColumn({ name: 'portfolioCorrectionId' })
    @ManyToOne(() => PortfolioCorrection, (correction) => correction.aiCorrection, {
        onDelete: 'CASCADE',
    })
    portfolioCorrection: PortfolioCorrection;
}
