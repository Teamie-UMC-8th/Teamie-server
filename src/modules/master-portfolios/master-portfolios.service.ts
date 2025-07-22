import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Questions } from './entities/questions.entity';
import { Repository } from 'typeorm';
import { MasterPortfolio } from './entities/master-portfolios.entity';
import { LLMService } from 'src/infra/llm/llm.service';
import { Question } from 'src/common/types/question.type';
import { MasterPortfolioOutput } from 'src/common/types/master-portfolio.type';
import { MasterPortfolioResponseDto } from './dtos/master-portfolio-response.dto';
import {
    MasterPortfolioDuplicateException,
    MasterPortfolioNotFoundException,
} from 'src/common/exceptions/custom.errors';
import { QuestionResponseDto } from './dtos/question-response.dto';
import { QuestionType } from 'src/common/enums/question-type.enum';
import { UpdateMasterPortfolioDto } from './dtos/update-master-portfolio.dto';

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
        const questionEntities: QuestionResponseDto[] = [];
        for (const q of questions) {
            try {
                // questionType 유효성 검증
                if (!Object.values(QuestionType).includes(q.questionType)) {
                    // 추후 추가적인 처리 필요
                    throw new Error(`Invalid question type: ${q.questionType}`);
                }

                const questionEntity = this.questionsRepository.create({
                    questionId: q.id,
                    questionType: q.questionType as QuestionType,
                    question: q.question,
                    masterPortfolio: { id: masterPortfolioId },
                });
                const savedQuestion = await this.questionsRepository.save(questionEntity);
                questionEntities.push(QuestionResponseDto.from(savedQuestion));
            } catch (e) {
                console.error(`질문 생성 중 오류 발생: ${e.message}`);
                throw new InternalServerErrorException(`Failed to create question: ${e.message}`);
            }
        }

        return questionEntities;
    }

    async generateMasterPortfolio(userId: number, projectId: number) {
        // 임시로 더미 데이터 사용
        let projectData: any;
        const generatedPortfolio: MasterPortfolioOutput =
            await this.llmService.generateMasterPortfolio(projectData);
        if (!generatedPortfolio) {
            throw new InternalServerErrorException('Failed to generate master portfolio');
        }

        const updateData: UpdateMasterPortfolioDto = {
            detailInfo: generatedPortfolio.detailInfo,
            assignedTask: generatedPortfolio.assignedTask,
            keyAchievement: generatedPortfolio.keyAchievement,
            insight: generatedPortfolio.insight,
        };

        // 생성된 마스터 포트폴리오를 데이터베이스에 저장합니다.
        // affected 검증 필요
        await this.masterPortfolioRepository.update(
            {
                user: { id: userId },
                project: { id: projectId },
            },
            updateData
        );
        const generatedPortfolioResponse = await this.masterPortfolioRepository.findOne({
            where: { user: { id: userId }, project: { id: projectId } },
        });
        if (!generatedPortfolioResponse) {
            throw new MasterPortfolioNotFoundException();
        }
        return MasterPortfolioResponseDto.from(generatedPortfolioResponse);
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
        await this.masterPortfolioRepository.save(masterPortfolio);
        return MasterPortfolioResponseDto.from(masterPortfolio);
    }
}
