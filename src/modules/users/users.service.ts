import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { Repository } from 'typeorm';
import { KakaoUserAfterAuth } from 'src/common/decorators/user.decorator';
import { UserProfileResponseDto } from './dtos/user-profile.dto';
import { UserNotFoundException } from 'src/common/exceptions/custom.errors';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepostiory: Repository<User>
    ) {}

    //회원가입 여부 확인
    async findUserByKakaoId(kakaoId: string): Promise<User | null> {
        return await this.userRepostiory.findOne({
            where: {
                kakaoId: kakaoId,
            },
        });
    }

    //회원가입
    async createUser(kakaoUser: KakaoUserAfterAuth): Promise<User> {
        const user = this.userRepostiory.create({
            name: kakaoUser.nickname,
            email: kakaoUser.email,
            imageUrl: kakaoUser.profileImage,
            kakaoId: kakaoUser.id,
        });
        return await this.userRepostiory.save(user);
    }

    //사용자 프로필 조회
    async getUserProfile(userId: number) {
        const profile = await this.userRepostiory.findOne({
            where: { id: userId },
            select: ['imageUrl', 'name', 'school', 'major', 'email', 'projectNum'],
        });
        if (!profile) throw new UserNotFoundException();
        return UserProfileResponseDto.fromEntity(profile);
    }
}
