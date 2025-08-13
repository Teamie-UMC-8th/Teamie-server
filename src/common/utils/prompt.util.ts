import { ChatPromptTemplate } from '@langchain/core/prompts';
import { PromptLoadingException } from '../exceptions/custom.errors';
import { PromptLoader } from './prompt.loader';

export class PromptManager {
    static async getPrompt(promptLoader: PromptLoader, fileName: string) {
        let promptText: string;
        try {
            promptText = await promptLoader.load(fileName);
        } catch (e) {
            throw new PromptLoadingException(`파일 로딩 실패 (${fileName})`);
        }

        let prompt: ChatPromptTemplate;
        try {
            prompt = ChatPromptTemplate.fromTemplate(promptText);
        } catch (e) {
            throw new PromptLoadingException(`프롬프트 로딩 실패 (${fileName})`);
        }

        return prompt;
    }
}
