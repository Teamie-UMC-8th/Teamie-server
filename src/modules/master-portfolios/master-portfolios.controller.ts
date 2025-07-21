import { Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { MasterPortfoliosService } from './master-portfolios.service';
import { User } from 'src/common/decorators/user.decorator';

@Controller('master-portfolios')
export class MasterPortfoliosController {
    constructor(private readonly masterPortfoliosService: MasterPortfoliosService) {}

    @Post(':projectId/questions')
    async createQuestions(@Param('projectId', ParseIntPipe) projectId: number) {
        return this.masterPortfoliosService.createQuestions(projectId);
    }

    @Post(':projectId/')
    async createMasterPortfolio(
        @Param('projectId', ParseIntPipe) projectId: number,
        @User('id') userId: number
    ) {
        return this.masterPortfoliosService.createMasterPortfolio(userId, projectId);
    }
}
