import { QuestionType } from 'src/common/enums/question-type.enum';
import { Questions } from '../entities/questions.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { AnswerType } from 'src/common/enums/answer-type.enum';

export class QuestionResponseDto {
    @ApiProperty({ example: 1, description: '질문 ID' })
    questionId: number;

    @ApiProperty({ example: '프로젝트에서 어려웠던 점은?', description: '질문 내용' })
    question: string;

    @ApiProperty({ enum: QuestionType, description: '질문 유형' })
    questionType: QuestionType;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsEnum(AnswerType)
    answer?: AnswerType;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    reason?: string;

    static from(question: Questions): QuestionResponseDto {
        const dto = new QuestionResponseDto();
        dto.question = question.question;
        dto.answer = question.answer as AnswerType;
        dto.reason = question.reason || '';
        dto.questionType = question.questionType;
        dto.questionId = question.questionId;
        return dto;
    }
}

export class UpdateQuestionDto {
    @IsNumber()
    @ApiProperty({ example: 1, description: '질문 ID' })
    questionId: number;

    @IsEnum(AnswerType)
    @IsOptional()
    @ApiProperty({
        enum: AnswerType,
        required: false,
        description: '답변 (YES, NO)',
        example: AnswerType.YES,
    })
    answer?: AnswerType;
    @IsString()
    @IsOptional()
    @ApiProperty({
        required: false,
        description: 'TEXT 타입이거나 답이 NO일 때, 입력 받는 답변 사유',
        example: '답변 사유가 필요할 때 입력하면 됩니다.',
    })
    reason?: string;
}
