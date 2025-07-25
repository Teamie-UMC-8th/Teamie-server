import { Module } from '@nestjs/common';
import { FinalPortfoliosController } from './final-portfolios.controller';
import { FinalPortfoliosService } from './final-portfoilos.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinalPortfolio } from './final-portfolios.entity';

@Module({
    imports: [TypeOrmModule.forFeature([FinalPortfolio])],
    controllers: [FinalPortfoliosController],
    providers: [FinalPortfoliosService],
})
export class FinalPortfoliosModule {}
