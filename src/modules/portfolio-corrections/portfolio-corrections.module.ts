import { Module } from '@nestjs/common';
import { PortfolioCorrectionsService } from './services/portfolio-corrections.service';
import { PortfolioCorrectionsController } from './portfolio-corrections.controller';
import { LLMModule } from 'src/infra/llm/llm.module';
import { PromptLoader } from 'src/common/utils/prompt.loader';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioCorrection } from './entities/portfolio-correction.entity';
import { AICorrection } from './entities/ai-correction.entity';
import { Project } from '../projects/entities/projects.entity';
import { RAGData } from './entities/rag-data.entity';
import { MasterPortfolioAI } from '../master-portfolios/entities/master-portfolio-ai.entity';
import { MasterPortfolio } from '../master-portfolios/entities/master-portfolios.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            PortfolioCorrection,
            AICorrection,
            Project,
            RAGData,
            MasterPortfolioAI,
            MasterPortfolio,
        ]),
        LLMModule,
    ],
    controllers: [PortfolioCorrectionsController],
    providers: [PortfolioCorrectionsService, PromptLoader],
    exports: [PortfolioCorrectionsService],
})
export class PortfolioCorrectionsModule {}
