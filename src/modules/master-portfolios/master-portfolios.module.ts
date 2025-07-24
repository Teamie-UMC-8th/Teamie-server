import { Module } from '@nestjs/common';
import { MasterPortfoliosService } from './master-portfolios.service';
import { MasterPortfoliosController } from './master-portfolios.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Questions } from './entities/questions.entity';
import { MasterPortfolio } from './entities/master-portfolios.entity';
import { LLMModule } from 'src/infra/llm/llm.module';

@Module({
    imports: [TypeOrmModule.forFeature([Questions, MasterPortfolio]), LLMModule],
    controllers: [MasterPortfoliosController],
    providers: [MasterPortfoliosService],
})
export class MasterPortfoliosModule {}
