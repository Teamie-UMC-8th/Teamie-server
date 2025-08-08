import { Module } from '@nestjs/common';
import { PromptLoader } from 'src/common/utils/prompt.loader';
import { LLMService } from './llm.service';
import { RagService } from './rag.service';

@Module({
    providers: [LLMService, PromptLoader, RagService],
    exports: [LLMService, RagService],
})
export class LLMModule {}
