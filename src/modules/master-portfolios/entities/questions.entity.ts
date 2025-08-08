import { QuestionType } from 'src/common/enums/question-type.enum';
import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { MasterPortfolio } from './master-portfolios.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { AnswerType } from 'src/common/enums/answer-type.enum';

@Entity()
@Unique(['questionId', 'masterPortfolio'])
export class Questions extends BaseEntity {
    @Column()
    questionId: number;
    @Column({
        type: 'enum',
        enum: QuestionType,
    })
    questionType: QuestionType;
    @Column()
    question: string;
    @Column({
        type: 'enum',
        enum: AnswerType,
        nullable: true,
    })
    answer: string;
    @Column({ length: 300, nullable: true })
    reason: string;
    @ManyToOne(() => MasterPortfolio, (masterPortfolio) => masterPortfolio.questions, {
        onDelete: 'CASCADE',
    })
    masterPortfolio: MasterPortfolio;
}
