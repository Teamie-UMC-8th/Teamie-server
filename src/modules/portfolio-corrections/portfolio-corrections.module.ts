import { Module } from '@nestjs/common';
import { PortfolioCorrectionsService } from './portfolio-corrections.service';
import { PortfolioCorrectionsController } from './portfolio-corrections.controller';
import { LLMModule } from 'src/infra/llm/llm.module';
import { PromptLoader } from 'src/common/utils/prompt.loader';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioCorrection } from './entities/portfolio-correction.entity';
import { AICorrection } from './entities/ai-correction.entity';

@Module({
    imports: [TypeOrmModule.forFeature([PortfolioCorrection, AICorrection]), LLMModule],
    controllers: [PortfolioCorrectionsController],
    providers: [PortfolioCorrectionsService, PromptLoader],
})
export class PortfolioCorrectionsModule {}
