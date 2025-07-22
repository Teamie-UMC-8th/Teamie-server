import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { MasterPortfoliosService } from './master-portfolios.service';
import { User } from 'src/common/decorators/user.decorator';
import { MasterPortfolioRequestDto } from './dtos/master-portfolio-request.dto';

@Controller('master-portfolios')
export class MasterPortfoliosController {
    constructor(private readonly masterPortfoliosService: MasterPortfoliosService) {}

    @Post(':projectId/questions')
    async createQuestions(
        @Param('projectId', ParseIntPipe) projectId: number,
        @User('id') userId: number
    ) {
        return this.masterPortfoliosService.createQuestions(userId, projectId);
    }

    @Post(':projectId/')
    async createMasterPortfolio(
        @Param('projectId', ParseIntPipe) projectId: number,
        @User('id') userId: number
    ) {
        return this.masterPortfoliosService.createMasterPortfolio(userId, projectId);
    }

    @Post(':projectId/generate')
    async generateMasterPortfolio(
        @Param('projectId', ParseIntPipe) projectId: number,
        @User('id') userId: number
    ) {
        return this.masterPortfoliosService.generateMasterPortfolio(userId, projectId);
    }

    @Get(':projectId')
    async getMasterPortfolio(
        @Param('projectId', ParseIntPipe) projectId: number,
        @User('id') userId: number
    ) {
        return this.masterPortfoliosService.getMasterPortfolio(userId, projectId);
    }

    @Patch(':projectId')
    async updateMasterPortfolio(
        @Param('projectId', ParseIntPipe) projectId: number,
        @User('id') userId: number,
        @Body() updateDataDto: MasterPortfolioRequestDto
    ) {
        return this.masterPortfoliosService.updateMasterPortfolio(userId, projectId, updateDataDto);
    }
}
