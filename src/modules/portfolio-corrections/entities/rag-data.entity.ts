import { BaseEntity } from 'src/common/entities/base.entity';
import { RAGDataType } from 'src/common/enums/rag-data-type.enum';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { PortfolioCorrection } from './portfolio-correction.entity';

@Entity()
export class RAGData extends BaseEntity {
    @Column({ nullable: true })
    keyword: string;

    @Column({ type: 'text', nullable: true })
    link: string;

    @Column({ nullable: true })
    title: string;

    @Column({ type: 'enum', enum: RAGDataType, nullable: false })
    type: RAGDataType;

    @JoinColumn()
    @ManyToOne(() => PortfolioCorrection, (portfolioCorrection) => portfolioCorrection.ragData, {
        onDelete: 'CASCADE',
    })
    portfolioCorrection: PortfolioCorrection;
}
