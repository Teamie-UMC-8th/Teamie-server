import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Question } from '../../common/types/question.type';
import { QuestionResponseFormat } from './formats/question-response.format';
import { PromptLoader } from 'src/common/utils/prompt.loader';
import { MasterPortfolioResponseFormat } from './formats/master-portfolio-response.format';
import { MasterPortfolioOutput } from 'src/common/types/master-portfolio.type';
import { PromptLoadingException } from 'src/common/exceptions/custom.errors';

@Injectable()
export class LLMService {
    private apiKey?: string;
    private baseURL: string;

    constructor(private readonly promptLoader: PromptLoader) {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.baseURL = process.env.OPENROUTER_API_BASE_URL || 'https://openrouter.ai/api/v1';
    }

    // 실제 LLM 호출을 처리하는 메소드
    async generate(
        model: string,
        messages: Array<{ role: string; content: string }>,
        responseFormat: object
    ) {
        const headers = {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
        };

        const completions = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model,
                messages,
                response_format: responseFormat,
            }),
        });
        if (!completions.ok) {
            const errorText = await completions.text();
            throw new InternalServerErrorException(
                `LLM API 호출 실패: ${completions.status} - ${errorText}`
            );
        }

        return completions;
    }

    async generateQuestions(inputData: string): Promise<Array<Question>> {
        // 질문 생성 프롬프트를 로드합니다.
        let questionPrompt: string;
        try {
            questionPrompt = await this.promptLoader.load('question.prompt.md');
        } catch (e) {
            throw new PromptLoadingException('question.prompt.md');
        }

        const model =
            process.env.QUESTION_GENERATION_MODEL || 'google/gemini-2.5-flash-lite-preview-06-17';
        const messages = [
            {
                role: 'system',
                content: questionPrompt,
            },
        ];

        const completions = await this.generate(model, messages, QuestionResponseFormat);
        const responseData = await completions.json();
        let questions: Array<Question>;

        try {
            const responseJsonData = JSON.parse(responseData.choices[0].message.content);
            questions = responseJsonData.questions;
        } catch (e) {
            // 별도 처리 필요
            throw new InternalServerErrorException(`Failed to parse response: ${e.message}`);
        }

        return questions;
    }

    async generateMasterPortfolio(projectData: any) {
        let masterPortfolioPrompt: string;
        try {
            masterPortfolioPrompt = await this.promptLoader.load('master-portfolio.prompt.md');
            projectData = await this.promptLoader.load('dummy-input.json');
        } catch (e) {
            throw new PromptLoadingException('master-portfolio.prompt.md');
        }
        masterPortfolioPrompt = masterPortfolioPrompt.replace(
            '{project_data}',
            JSON.stringify(projectData, null, 4)
        );

        const model =
            process.env.MASTER_PORTFOLIO_MODEL || 'google/gemini-2.5-flash-lite-preview-06-17';
        const messages = [
            {
                role: 'system',
                content: masterPortfolioPrompt,
            },
        ];

        const completions = await this.generate(model, messages, MasterPortfolioResponseFormat);
        const responseData = await completions.json();
        let responseJsonData: MasterPortfolioOutput;

        try {
            responseJsonData = JSON.parse(responseData.choices[0].message.content);
        } catch (e) {
            // 별도 처리 필요
            throw new InternalServerErrorException(`Failed to parse response: ${e.message}`);
        }

        return responseJsonData;
    }
}
