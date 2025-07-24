import { Module } from '@nestjs/common';
import { MasterPortfoliosService } from './master-portfolios.service';
import { MasterPortfoliosController } from './master-portfolios.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Questions } from './entities/questions.entity';
import { MasterPortfolio } from './entities/master-portfolios.entity';
import { LLMModule } from 'src/infra/llm/llm.module';
import { MasterPortfolioAI } from './entities/master-portfolio-ai.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Questions, MasterPortfolio, MasterPortfolioAI]), LLMModule],
    controllers: [MasterPortfoliosController],
    providers: [MasterPortfoliosService],
})
export class MasterPortfoliosModule {}
