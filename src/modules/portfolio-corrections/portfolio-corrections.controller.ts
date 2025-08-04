import { Body, Controller, Get, Post } from '@nestjs/common';
import { PortfolioCorrectionsService } from './portfolio-corrections.service';
import { CreateCorrectionsDto } from './dtos/create-corrections.dto';
import { ApiTags } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';

@ApiTags('PortfolioCorrections')
@Controller('portfolio-corrections')
export class PortfolioCorrectionsController {
    constructor(private readonly portfolioCorrectionsService: PortfolioCorrectionsService) {}

    @Post('generate')
    async generateCorrection(
        @User('id') userId: number,
        @Body() createCorrectionDto: CreateCorrectionsDto,
    ) {
        await this.portfolioCorrectionsService.generateCorrection(userId, createCorrectionDto.selectedProjects);
    }

    @Get(':correctionId')
    async getCorrection() {
        await this.portfolioCorrectionsService.getCorrection();
    }
}
