import { QuestionType } from 'src/common/enums/question-type.enum';
import { Questions } from '../entities/questions.entity';
import { ApiProperty } from '@nestjs/swagger';

export class QuestionResponseDto {
    @ApiProperty({ example: 1, description: '질문 ID' })
    questionId: number;

    @ApiProperty({ example: '프로젝트에서 어려웠던 점은?', description: '질문 내용' })
    question: string;

    @ApiProperty({ enum: QuestionType, description: '질문 유형' })
    questionType: QuestionType;

    @ApiProperty({ required: false })
    answer?: string;

    @ApiProperty({ required: false })
    reason?: string;

    static from(question: Questions): QuestionResponseDto {
        const dto = new QuestionResponseDto();
        dto.question = question.question;
        dto.answer = question.answer || '';
        dto.reason = question.reason || '';
        dto.questionType = question.questionType;
        dto.questionId = question.questionId;
        return dto;
    }
}
