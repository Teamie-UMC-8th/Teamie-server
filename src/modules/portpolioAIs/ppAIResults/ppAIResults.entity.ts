import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { PortpolioAI } from "../portpolioAIs.entity";

@Entity()
export class PPAIResult extends BaseEntity{
    @Column()
    json: string;

    @ManyToOne(() => PortpolioAI, (ppAI) => ppAI.results, {onDelete: 'CASCADE'})
    portpolioAI: PortpolioAI;
}