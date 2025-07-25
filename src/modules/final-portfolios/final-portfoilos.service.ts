import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { FinalPortfolio } from './final-portfolios.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserFinalPortfoliosResponseDto } from './dtos/user-final-portfolios-response';
import { PaginatedResponseDto } from 'src/common/response/paginated-response.dto';

@Injectable()
export class FinalPortfoliosService {
    constructor(
        @InjectRepository(FinalPortfolio)
        private readonly finalPortfolioRepository: Repository<FinalPortfolio>
    ) {}

    async getFinalProtfoliosByUser(userId: number, cursorDate: Date, pageSize: number) {
        const portfolios = await this.finalPortfolioRepository
            .createQueryBuilder('fp')
            .where('fp.userId = :userId', { userId })
            .andWhere('fp.createdAt < :cursorDate', { cursorDate })
            .orderBy('fp.createdAt', 'DESC')
            .take(pageSize + 1)
            .getMany();

        const hasNextPage: boolean = portfolios.length > pageSize;
        const nextCursor: string | null =
            portfolios.length > 0 && hasNextPage
                ? portfolios[portfolios.length - 2].createdAt.toISOString()
                : null;
        const result = portfolios
            .slice(0, pageSize)
            .map((entity) => UserFinalPortfoliosResponseDto.fromEntity(entity));
        return PaginatedResponseDto.of(result, nextCursor, hasNextPage);
    }
}
