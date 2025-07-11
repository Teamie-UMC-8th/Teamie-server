import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { Repository } from 'typeorm';
import { KakaoUserAfterAuth } from 'src/common/decorators/user.decorator';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepostiory: Repository<User>,
    ){}

    async findUserByKakaoId(kakaoId: string): Promise<User | null> {
        return await this.userRepostiory.findOne({
            where: {
                kakaoId: kakaoId,
            },
        });
    }

    async createUser(kakaoUser: KakaoUserAfterAuth): Promise<User> {
        const user = this.userRepostiory.create({
            name: kakaoUser.nickname,
            email: kakaoUser.email,
            imageUrl: kakaoUser.profileImage,
            kakaoId: kakaoUser.id,
        });
        return await this.userRepostiory.save(user);
    }
}
