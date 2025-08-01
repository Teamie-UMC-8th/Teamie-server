import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { QueryRunner, Repository } from 'typeorm';
import { KakaoUserAfterAuth } from 'src/common/decorators/user.decorator';
import { UpdateProfileRequestDto, UserProfileResponseDto } from './dtos/user-profile.dto';
import {
    BadRequestException,
    ForbiddenUserForMasterPortfolioException,
    MasterPortfolioNotFoundException,
    ProjectNotFoundException,
    TransactionException,
    UserNotFoundException,
} from 'src/common/exceptions/custom.errors';
import { UploadService } from 'src/infra/upload/upload.service';
import { UserMainTaskRequestDTO } from './dtos/user-main-task.dto';
import { MasterPortfoliosService } from '../master-portfolios/master-portfolios.service';
import { UserMasterPortfoliosResponseDto } from '../master-portfolios/dtos/user-master-portfolios-response.dto';
import { MasterPortfolio } from '../master-portfolios/entities/master-portfolios.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepostiory: Repository<User>,
        private readonly uploadService: UploadService,
        private readonly masterPortfoliosService: MasterPortfoliosService
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

    //사용자 프로필 수정
    async updateUserProfile(
        qr: QueryRunner,
        userId: number,
        body?: UpdateProfileRequestDto,
        file?: Express.Multer.File
    ) {
        const updateData: Partial<UpdateProfileRequestDto & { imageUrl: string }> = {};

        // 프로필 이미지 S3 저장
        if (file) {
            const fileUrl = await this.uploadService.uploadFile(file);
            updateData.imageUrl = fileUrl;
        }
        if (body?.school) updateData.school = body?.school;
        if (body?.major) updateData.major = body.major;
        if (Object.keys(updateData).length === 0) throw new BadRequestException();

        try {
            await qr.manager.update(User, { id: userId }, updateData);
            const user = await qr.manager.findOne(User, {
                where: { id: userId },
                select: ['imageUrl', 'name', 'school', 'major', 'email', 'projectNum'],
            });
            if (!user) {
                throw new UserNotFoundException();
            }
            return UserProfileResponseDto.fromEntity(user);
        } catch (err) {
            console.log(err);
            throw new TransactionException('User');
        }
    }

    // 마이페이지/마스터포트폴리오 - 주요 업무 수정
    async updateMainTaskField(
        qr: QueryRunner,
        userId: number,
        portfolioId: number,
        body: UserMainTaskRequestDTO
    ): Promise<UserMasterPortfoliosResponseDto> {
        //1. 포트폴리오 owner 확인
        const check = await this.masterPortfoliosService.checkMasterPortfolioOwner(
            userId,
            portfolioId
        );
        if (!check) {
            throw new ForbiddenUserForMasterPortfolioException({ portfolioId: portfolioId });
        }
        try {
            //2. 업데이트
            await qr.manager.update(MasterPortfolio, { id: portfolioId }, body);
            //3. 조회 및 데이터 반환
            const masterPortfolio = await qr.manager.findOne(MasterPortfolio, {
                where: { id: portfolioId },
                relations: ['project'],
                select: {
                    id: true,
                    category: true,
                    contributionRate: true,
                    mainTask: true,
                    project: {
                        name: true,
                        createdAt: true,
                        completedAt: true,
                    },
                },
            });
            if (!masterPortfolio) throw new MasterPortfolioNotFoundException();
            return UserMasterPortfoliosResponseDto.fromNestedEntity(masterPortfolio);
        } catch (err) {
            console.log(err);
            throw new TransactionException('User');
        }
    }
}
