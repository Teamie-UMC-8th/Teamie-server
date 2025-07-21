import { Module } from '@nestjs/common';
import { MasterPortfoliosService } from './master-portfolios.service';
import { MasterPortfoliosController } from './master-portfolios.controller';
import { PromptLoader } from 'src/common/utils/prompt.loader';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Questions } from './entities/questions.entity';
import { MasterPortfolio } from './entities/master-portfolios.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Questions, MasterPortfolio])],
    controllers: [MasterPortfoliosController],
    providers: [MasterPortfoliosService, PromptLoader],
})
export class MasterPortfoliosModule {}
