import { Module } from '@nestjs/common';
import { PromptLoader } from 'src/common/utils/prompt.loader';
import { LLMService } from './llm.service';

@Module({
    providers: [LLMService, PromptLoader],
    exports: [LLMService]
})
export class LLMModule {}
