import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { PortfolioAI } from "../portfolioAIs.entity";

@Entity()
export class PFAIResult extends BaseEntity{
    @Column({ length: 255 })
    json: string;

    @ManyToOne(() => PortfolioAI, (pfAI) => pfAI.results, {onDelete: 'CASCADE'})
    portfolioAI: PortfolioAI;
}