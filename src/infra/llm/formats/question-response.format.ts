import { QuestionType } from 'src/common/enums/question-type.enum';

export const QuestionResponseFormat = {
    type: 'json_object',
    schema: {
        type: 'object',
        properties: {
            questions: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        question: { type: 'string' },
                        questionType: {
                            type: 'string',
                            enum: Object.values(QuestionType),
                            description: '질문 유형',
                        },
                    },
                    required: ['id', 'question', 'questionType'],
                },
            },
        },
        required: ['questions'],
    },
};

console.log('QuestionResponseFormat:', JSON.stringify(QuestionResponseFormat, null, 2));
