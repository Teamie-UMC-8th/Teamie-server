import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryRunner, Repository } from 'typeorm';
import { User } from '../entities/users.entity';
import { UserNotFoundException } from 'src/common/exceptions/custom.errors';
import { UpdateProfileRequestDto } from '../dtos/user-profile.dto';

@Injectable()
export class UserRepository {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) {}

    async saveUser(qr: QueryRunner, user: User): Promise<User> {
        return await qr.manager.save(user);
    }

    //조회
    async findById(userId: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['id', 'name'],
        });
        if (!user) throw new UserNotFoundException();
        return user;
    }

    async findByKakaoId(qr: QueryRunner, kakaoId: string): Promise<User | null> {
        return await qr.manager.findOne(User, {
            where: {
                kakaoId: kakaoId,
            },
        });
    }

    async findAllByIds(arr: number[]): Promise<User[]> {
        return await this.userRepository.findBy({ id: In(arr) });
    }

    async findByIdWithProfile(userId: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['imageUrl', 'name', 'school', 'major', 'email', 'projectNum'],
        });
        if (!user) throw new UserNotFoundException();
        return user;
    }

    // 수정
    async updateUsingQR(
        qr: QueryRunner,
        userId: number,
        updateData: Partial<UpdateProfileRequestDto & { imageUrl: string }>
    ): Promise<void> {
        await qr.manager.update(User, { id: userId }, updateData);
    }

    // 조회 with QureyRunner
    async findByIdWithProfileUsingQR(qr: QueryRunner, userId: number): Promise<User> {
        const user = await qr.manager.findOne(User, {
            where: { id: userId },
            select: ['imageUrl', 'name', 'school', 'major', 'email', 'projectNum'],
        });
        if (!user) throw new UserNotFoundException();
        return user;
    }
}
