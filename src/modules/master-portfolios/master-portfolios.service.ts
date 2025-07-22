import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Questions } from './entities/questions.entity';
import { Repository } from 'typeorm';
import { MasterPortfolio } from './entities/master-portfolios.entity';
import { LLMService } from 'src/infra/llm/llm.service';
import { Question } from 'src/common/types/question.type';
import {
    MasterPortfolioDuplicateException,
    MasterPortfolioNotFoundException,
} from 'src/common/exceptions/custom.errors';

@Injectable()
export class MasterPortfoliosService {
    constructor(
        @InjectRepository(Questions)
        private readonly questionsRepository: Repository<Questions>,
        @InjectRepository(MasterPortfolio)
        private readonly masterPortfolioRepository: Repository<MasterPortfolio>,
        private readonly llmService: LLMService
    ) {}

    async createQuestions(userId: number, projectId: number) {
        // 프로젝트 ID로 마스터 포트폴리오를 찾습니다.
        const masterPortfolio = await this.masterPortfolioRepository.findOne({
            where: { project: { id: projectId }, user: { id: userId } },
        });
        if (!masterPortfolio) {
            throw new MasterPortfolioNotFoundException();
        }
        const masterPortfolioId = masterPortfolio.id;

        // LLM을 호출하여 질문을 생성합니다.
        const questions: Array<Question> = await this.llmService.generateQuestions();

        // 생성된 질문들을 데이터베이스에 저장합니다.
        const questionEntities: Array<any> = [];
        for (const q of questions) {
            try {
                const questionEntity = this.questionsRepository.create({
                    questionId: q.id,
                    questionType: q.questionType,
                    question: q.question,
                    masterPortfolio: { id: masterPortfolioId },
                });
                const question = await this.questionsRepository.save(questionEntity);
                questionEntities.push({
                    questionId: question.questionId,
                    questionType: question.questionType,
                    question: question.question,
                });
            } catch (e) {
                console.error(`질문 생성 중 오류 발생: ${e.message}`);
                throw new InternalServerErrorException(`Failed to create question: ${e.message}`);
            }
        }
        return questionEntities;
    }

    async createMasterPortfolio(userId: number, projectId: number) {
        const existingPortfolio = await this.masterPortfolioRepository.findOne({
            where: { user: { id: userId }, project: { id: projectId } },
        });
        if (existingPortfolio) {
            throw new MasterPortfolioDuplicateException(userId, projectId);
        }

        const masterPortfolio = this.masterPortfolioRepository.create({
            user: { id: userId },
            project: { id: projectId },
        });
        return this.masterPortfolioRepository.save(masterPortfolio);
    }
}
