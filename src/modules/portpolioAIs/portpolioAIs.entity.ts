import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { User } from "../users/users.entity";
import { PPAIResult } from "./ppAIResults/ppAIResults.entity";

@Entity()
export class PortpolioAI extends BaseEntity{
    @Column()
    title: string;

    @Column()
    submissionTarget: string;

    @Column()
    applicationType: string;    // TODO : ENUM으로 바꾸기

    @Column()
    jobTitle: string;

    @Column()
    highlight: string;

    @Column()
    companyInsight: string;

    @Column()
    jd: string;

    @ManyToOne(() => User, (user) => user.ppAIs, {onDelete: 'CASCADE'})
    user: User;

    @OneToMany(() => PPAIResult, (result) => result.portpolioAI)
    results: PPAIResult[];
}