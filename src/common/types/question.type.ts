import { QuestionType } from 'src/common/enums/question-type.enum';

export interface Question {
    id: number;
    question: string;
    questionType: QuestionType;
}
