import { QuestionType } from 'src/common/enums/question-type.enum';
import z from 'zod';

export const questionSchema = z.object({
    questions: z.array(
        z.object({
            id: z.number(),
            question: z.string(),
            questionType: z
                .enum(Object.values(QuestionType) as [string, ...string[]])
                .describe('질문 유형'),
        })
    ),
});

export type Questions = z.infer<typeof questionSchema>;
