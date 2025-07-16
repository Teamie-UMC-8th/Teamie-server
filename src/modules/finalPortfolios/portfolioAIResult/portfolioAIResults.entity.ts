import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { FinalPortfolio } from '../finalPortfolios.entity';

@Entity()
export class PortfolioAIResult extends BaseEntity {
    @Column({ length: 255 })
    jsonLink: string;

    @ManyToOne(() => FinalPortfolio, (finalPortfolio) => finalPortfolio.results, {
        onDelete: 'CASCADE',
    })
    finalPortfolio: FinalPortfolio;
}
