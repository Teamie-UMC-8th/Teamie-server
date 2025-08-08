import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PersonalRecall } from '../entities/personal-recalls.entity';
import { Repository } from 'typeorm';
import { PersonalRecallResponseDto } from '../dtos/personal-recall-response.dto';
import { PersonalRecallNotFoundException } from 'src/common/exceptions/custom.errors';

@Injectable()
export class PersonalRecallsService {
    constructor(
        @InjectRepository(PersonalRecall)
        private readonly personalRecallRepository: Repository<PersonalRecall>
    ) {}

    async getPersonalRecalls(userId: number, projectId: number) {
        const personalRecall = await this.personalRecallRepository.findOne({
            where: {
                user: { id: userId },
                project: { id: projectId },
            },
        });
        if (!personalRecall) {
            throw new PersonalRecallNotFoundException();
        }

        return PersonalRecallResponseDto.from(personalRecall);
    }

    async updatePersonalRecalls(userId: number, projectId: number, updateData) {
        const personalRecall = await this.personalRecallRepository.findOne({
            where: {
                user: { id: userId },
                project: { id: projectId },
            },
        });
        if (!personalRecall) {
            throw new PersonalRecallNotFoundException();
        }

        Object.assign(personalRecall, updateData);
        await this.personalRecallRepository.save(personalRecall);
        return PersonalRecallResponseDto.from(personalRecall);
    }
}
