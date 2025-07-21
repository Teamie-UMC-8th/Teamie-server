import { QuestionType } from 'src/common/enums/question-type.enum';
import { Column, Entity, ManyToOne } from 'typeorm';
import { MasterPortfolio } from './master-portfolios.entity';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity()
export class Questions extends BaseEntity {
    @Column({ unique: true })
    questionId: number;
    @Column({
        type: 'enum',
        enum: QuestionType,
    })
    questionType: QuestionType;
    @Column()
    question: string;
    @Column({ nullable: true })
    answer: string;
    @Column({ length: 300, nullable: true })
    reason: string;
    @ManyToOne(() => MasterPortfolio, (masterPortfolio) => masterPortfolio.questions, {
        onDelete: 'CASCADE',
    })
    masterPortfolio: MasterPortfolio;
}
