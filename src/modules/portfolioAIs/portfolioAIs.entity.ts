import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { User } from "../users/users.entity";
import { PFAIResult } from "./pfAIResults/ppAIResults.entity";
import { ApplicationType } from "src/common/enums/applicationType.enum";

@Entity()
export class PortfolioAI extends BaseEntity{
    @Column({ length: 20 })
    title: string;

    @Column({ length: 20 })
    submissionTarget: string;

    @Column({
        type: 'enum',
        enum: ApplicationType,
        default: ApplicationType.INTERN
    })
    applicationType: ApplicationType;

    @Column({ length: 15 })
    jobTitle: string;

    @Column({ length: 80 })
    highlight: string;

    @Column({ length: 400 })
    companyInsight: string;

    @Column({ length: 400 })
    jd: string;

    @ManyToOne(() => User, (user) => user.pfAIs, {onDelete: 'CASCADE'})
    user: User;

    @OneToMany(() => PFAIResult, (result) => result.portfolioAI)
    results: PFAIResult[];
}