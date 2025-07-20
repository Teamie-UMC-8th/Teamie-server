import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PersonalRecall } from './entities/personal-recalls.entity';
import { Repository } from 'typeorm';
import { PersonalRecallResponseDto } from './dtos/personal-recall.dto';

@Injectable()
export class PersonalRecallsService {
    constructor(
        @InjectRepository(PersonalRecall)
        private readonly personalRecallRepository: Repository<PersonalRecall>
    ) {}

    async getPersonalRecalls(userId: number, projectId: number) {
        const personalRecalls = await this.personalRecallRepository.find({
            where: {
                user: { id: userId },
                project: { id: projectId },
            },
        });

        return PersonalRecallResponseDto.from(personalRecalls[0]);
    }

    async updatePersonalRecalls(userId: number, projectId: number, updateData) {
        const personalRecall = await this.personalRecallRepository.findOne({
            where: {
                user: { id: userId },
                project: { id: projectId },
            },
        });
        if (!personalRecall) {
            throw new Error('Personal recall not found');
        }

        Object.assign(personalRecall, updateData);
        await this.personalRecallRepository.save(personalRecall);
        return PersonalRecallResponseDto.from(personalRecall);
    }
}
