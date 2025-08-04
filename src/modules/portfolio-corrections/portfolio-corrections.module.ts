import { Module } from '@nestjs/common';
import { PortfolioCorrectionsService } from './portfolio-corrections.service';
import { PortfolioCorrectionsController } from './portfolio-corrections.controller';
import { LLMModule } from 'src/infra/llm/llm.module';
import { PromptLoader } from 'src/common/utils/prompt.loader';

@Module({
    imports: [LLMModule],
    controllers: [PortfolioCorrectionsController],
    providers: [PortfolioCorrectionsService, PromptLoader],
})
export class PortfolioCorrectionsModule {}
