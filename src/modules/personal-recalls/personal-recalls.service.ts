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
}
