import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/users.entity';
import { In, QueryRunner, Repository } from 'typeorm';
import { KakaoUserAfterAuth } from 'src/common/decorators/user.decorator';
import { UpdateProfileRequestDto, UserProfileResponseDto } from '../dtos/user-profile.dto';
import {
    BadRequestException,
    ForbiddenUserForMasterPortfolioException,
    MasterPortfolioNotFoundException,
    TransactionException,
} from 'src/common/exceptions/custom.errors';
import { UploadService } from 'src/infra/upload/upload.service';
import { UserMainTaskRequestDTO } from '../dtos/user-main-task.dto';
import { MasterPortfoliosService } from '../../master-portfolios/services/master-portfolios.service';
import { UserMasterPortfoliosResponseDto } from '../../master-portfolios/dtos/user-master-portfolios-response.dto';
import { MasterPortfolio } from '../../master-portfolios/entities/master-portfolios.entity';
import { UserProject } from '../../mappings/user-projects/userProjects.entity';
import { UserProjectResponseDto } from '../dtos/user-project.dto';
import { UserRepository } from '../repositories/user.repository';
@Injectable()
export class UsersService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly uploadService: UploadService,
        private readonly masterPortfoliosService: MasterPortfoliosService,
        @InjectRepository(UserProject)
        private readonly userProjectRepository: Repository<UserProject>
    ) {}

    //회원가입 여부 확인
    async findUserByKakaoId(kakaoId: string): Promise<User | null> {
        return await this.userRepository.findByKakaoId(kakaoId);
    }

    //회원가입
    async createUser(kakaoUser: KakaoUserAfterAuth): Promise<User> {
        return await this.userRepository.saveUser({
            name: kakaoUser.nickname,
            email: kakaoUser.email,
            imageUrl: kakaoUser.profileImage,
            kakaoId: kakaoUser.id,
        });
    }

    //사용자 리스트의 유효성 체크
    async checkIsUserExistByArray(arr: number[], projectId?: number) {
        const users = await this.userRepository.findAllByIds(arr);
        if (users.length !== arr.length)
            throw new BadRequestException('유효하지 않은 사용자 ID가 포함되어 있습니다.');
        if (projectId) {
            const userIds = users.map((user) => user.id);
            const userProjects = await this.userProjectRepository.find({
                where: {
                    user: { id: In(userIds) },
                    project: { id: projectId },
                },
            });

            if (userProjects.length !== users.length) {
                throw new BadRequestException(
                    '프로젝트에 참여하지 않은 사용자 ID가 포함되어 있습니다.'
                );
            }
        }
    }

    //사용자 프로필 조회
    async getUserProfile(userId: number) {
        const profile = await this.userRepository.findByIdWithProfile(userId);
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
            await this.userRepository.updateUsingQR(qr, userId, updateData);
            const user = await this.userRepository.findByIdWithProfileUsingQR(qr, userId);
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

    // 사용자가 속한 프로젝트들 조회
    async getProjectsByUser(userId: number) {
        const mappings = await this.userProjectRepository.find({
            where: { user: { id: userId } },
            relations: ['project'],
            select: {
                project: {
                    id: true,
                    name: true,
                },
                permission: true,
                createdAt: true,
            },
            order: {
                createdAt: 'ASC',
            },
        });
        return mappings;
    }

    // 사용자가 속한 프로젝트들 조회
    async getUserProject(userId: number): Promise<UserProjectResponseDto[]> {
        const mappings = await this.getProjectsByUser(userId);
        return mappings.map(UserProjectResponseDto.fromEntity);
    }
}
