import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/projects.entity';
import { UserProject } from '../mappings/user-projects/userProjects.entity';
import { QueryRunner, Repository } from 'typeorm';
import { projectPermission } from 'src/common/enums/project-permission.enum';
import { CreateProjectDto, CreateProjectResponseDto } from './dtos/create-project.dto';
import { ConfigService } from '@nestjs/config';
import { CommonResponse } from '../../common/response/common-response.dto';
import { UserInProjectDto, AllProjectResponseDto, PostDto } from './dtos/all-project-response.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { CompleteProjectResponseDto } from './dtos/complete-project.dto';
import { PersonalRecall } from '../personal-recalls/entities/personal-recalls.entity';
import {
    AlreadyProjectCompletedException,
    ProjectNotFoundException,
    PostsExceededException,
    RedisDataParseException,
    PostNotFoundException,
    NotPostAuthorException,
    AlreadyLeaderException,
    ForbiddenSelfAssignException,
    AssigneeNotMemberException,
    ProjectForbiddenException,
    ProjectUpdateForbiddenException,
    InvalidInvitecodeException,
    ProfileForbiddenException,
    ProjectTransactionException,
} from 'src/common/exceptions/custom.errors';
import { Step } from '../steps/entities/steps.entity';
import { CreateStepDto, CreateStepResponseDto } from '../steps/dtos/create-step.dto';
import { StepsService } from '../steps/steps.service';
import { CreatePostDto, CreatePostResponseDto } from './dtos/create-post.dto';
import { DeletePostResponseDto } from './dtos/delete-post-response.dto';
import { RedisClientType } from 'redis';
import { MasterPortfolio } from '../master-portfolios/entities/master-portfolios.entity';
import { MasterPortfoliosService } from '../master-portfolios/master-portfolios.service';
import { ChangeLeaderDto, ChangeLeaderResponseDto } from './dtos/change-leader.dto';
import { User } from '../users/entities/users.entity';
import { UpdateProfileDto, UpdateProfileResponseDto } from './dtos/update-profile.dto';
import { JoinProjectDto, JoinProjectResponseDto } from './dtos/join-project.dto';
import { ValidateInviteResponseDto } from './dtos/validate-invite.dto';
@Injectable()
export class ProjectsService {
    private readonly postsKeyPrefix: string;
    private readonly POSTS_KEY = (projectId: number) => `${this.postsKeyPrefix}:${projectId}`;
    private readonly POST_TTL_SECONDS: number;
    constructor(
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,

        @InjectRepository(UserProject)
        private readonly userProjectRepository: Repository<UserProject>,

        @InjectRepository(PersonalRecall)
        private readonly personalRecallRepository: Repository<PersonalRecall>,

        @InjectRepository(Step)
        private readonly stepRepository: Repository<Step>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @Inject('REDIS_CLIENT')
        private readonly redis: RedisClientType,
        private readonly configService: ConfigService,
        private readonly stepsService: StepsService,
        private readonly masterPortfoliosService: MasterPortfoliosService
    ) {
        this.postsKeyPrefix = this.configService.get<string>('POSTS_KEY_PREFIX', 'posts');
        const ttlStr = this.configService.get<string>('POST_TTL_SECONDS', `${48 * 3600}`);
        //숫자로 변환해서 실제 필드에 할당
        this.POST_TTL_SECONDS = parseInt(ttlStr, 10);
    }

    async createProject(
        qr: QueryRunner,
        dto: CreateProjectDto,
        userId: number
    ): Promise<CreateProjectResponseDto> {
        const { name } = dto;
        // 1) outer 스코프에 한 번만 선언
        let savedProject!: Project;

        try {
            // 2) Project 인스턴스 생성 (manager.create)
            const project = qr.manager.create(Project, {
                name,
                goal: '',
                rule: '',
                isCompleted: false,
                completedAt: null, // undefined 대신 null 권장
            });

            // 3) DB에 저장 → savedProject에 할당
            savedProject = await qr.manager.save(Project, project);

            // 4) UserProject 인스턴스 생성
            const userProject = qr.manager.create(UserProject, {
                user: { id: userId },
                project: savedProject,
                permission: projectPermission.LEAD,
                role: '',
            });

            // 5) UserProject도 저장
            await qr.manager.save(UserProject, userProject);
        } catch (err) {
            // 여기서 예외 나면 트랜잭션 인터셉터가 롤백합니다
            throw new ProjectTransactionException();
        }
        const code = generateRandomCode();
        const key = `invite:${code}`;
        const ttlSeconds = 60 * 60 * 24 * 3; //3일
        await this.redis.set(key, savedProject.id.toString());
        await this.redis.expire(key, ttlSeconds);

        const inviteCode = `${code}`;

        const now = new Date();
        const expiresAt = new Date(now.getTime() + this.POST_TTL_SECONDS * 1000).toISOString();

        return CreateProjectResponseDto.fromEntity(savedProject, inviteCode, expiresAt);
    }

    async joinValidate(inviteCode: string): Promise<ValidateInviteResponseDto> {
        //  inviteCode로 projectId 가져오기
        const projectId = await this.getProjectByInviteCode(inviteCode);
        if (!projectId) throw new InvalidInvitecodeException();

        return ValidateInviteResponseDto.fromEntity(projectId);
    }

    async joinProject(
        qr: QueryRunner,
        userId: number,
        dto: JoinProjectDto
    ): Promise<JoinProjectResponseDto> {
        const projectId = dto.projectId;
        //  프로젝트 엔티티에서 이름 조회
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            select: ['id', 'name'],
        });
        if (!project) throw new ProjectNotFoundException();
        //  유저 엔티티에서 이름 조회
        const user = await this.userRepository.findOneOrFail({
            where: { id: userId },
            select: ['id', 'name'],
        });
        //  아직 참여하지 않았다면 member로 추가
        const alreadyJoined = await this.isUserInProject(userId, projectId);
        if (!alreadyJoined) {
            await this.addUserToProject(userId, projectId, 'member', qr);
        }
        const message = `${user.name}님이 "${project.name}" 프로젝트에 참여되었습니다.`;
        const responseDto = JoinProjectResponseDto.fromEntity(message, project);

        return responseDto;
    }

    async getProjectFullData(userId: number, projectId: number): Promise<AllProjectResponseDto> {
        // 프로젝트 존재 검사
        const project = await this.assertProjectExists(projectId);
        // 프로젝트 멤버 권한 검사
        await this.checkProjectMember(userId, projectId);

        const userProjects = await this.userProjectRepository.find({
            where: { project: { id: projectId } },
            relations: ['user', 'user.managers', 'user.managers.task'],
        });

        const users = userProjects.map(UserInProjectDto.from);

        const key = `posts:${projectId}`;
        const postsRaw = (await this.redis.get(key)) || [];
        const posts = Array.isArray(postsRaw) ? postsRaw.map(PostDto.from) : [];

        return AllProjectResponseDto.fromEntity({ project, users, posts });
    }

    async updateProject(
        qr: QueryRunner,
        userId: number,
        projectId: number,
        dto: UpdateProjectDto
    ): Promise<AllProjectResponseDto> {
        //프로젝트 존재 검사
        const project = await this.assertProjectIsEditable(projectId);
        //프로젝트 팀장 여부
        const isLead = await this.checkProjectLeader(userId, projectId);

        // rule, goal은 팀장만 수정 가능
        if ((!isLead && dto.rule !== undefined) || (!isLead && dto.goal !== undefined)) {
            throw new ProjectUpdateForbiddenException();
        }

        // 해당 필드들만 조건부로 갱신
        if (dto.name !== undefined) project.name = dto.name;
        if (dto.rule !== undefined) project.rule = dto.rule;
        if (dto.goal !== undefined) project.goal = dto.goal;

        await qr.manager.save(project);

        return this.getProjectFullData(userId, projectId);
    }

    async completeProject(
        qr: QueryRunner,
        userId: number,
        projectId: number
    ): Promise<CompleteProjectResponseDto> {
        // 1) 프로젝트 존재 검사 & 수정 가능 확인
        const project = await this.assertProjectIsEditable(projectId);
        // 2) 팀장 권한 확인
        await this.checkProjectLeader(userId, projectId);

        // 3) 프로젝트 완료 처리
        project.isCompleted = true;
        project.completedAt = new Date();

        try {
            // 3-1) 프로젝트 저장
            await qr.manager.save(Project, project);

            // 3-2) 모든 멤버의 projectNum + 1
            const rawMembers = await this.userProjectRepository
                .createQueryBuilder('up')
                .leftJoin('up.user', 'user')
                .select(['up.userId AS userId', 'user.projectNum AS projectNum'])
                .where('up.projectId = :projectId', { projectId })
                .getRawMany<{ userId: number; projectNum: number }>();

            for (const { userId: memberId, projectNum } of rawMembers) {
                await qr.manager.update(User, { id: memberId }, { projectNum: projectNum + 1 });
            }

            // 3-3) PersonalRecall 생성 (create → save)
            const recall = qr.manager.create(PersonalRecall, {
                user: { id: userId },
                project: { id: projectId },
            });
            await qr.manager.save(PersonalRecall, recall);
        } catch (err) {
            throw new ProjectTransactionException();
        }

        // 4) 트랜잭션 범위 밖에서 MasterPortfolio 생성
        await this.masterPortfoliosService.createMasterPortfolio(userId, projectId);

        // 5) 응답 반환
        return CompleteProjectResponseDto.fromEntity(project);
    }
    async createStep(
        qr: QueryRunner,
        dto: CreateStepDto,
        projectId: number,
        userId: number
    ): Promise<CreateStepResponseDto> {
        // 프로젝트 멤버인지 확인
        await this.checkProjectMember(userId, projectId);
        let savedStep: Step;
        try {
            // 1) 엔티티 생성
            const step = qr.manager.create(Step, {
                ...dto,
                project: { id: projectId },
                createdBy: { id: userId },
            });

            // 2) 실제로 DB에 저장
            savedStep = await qr.manager.save(Step, step);
        } catch (err) {
            // 트랜잭션 중 오류 시 예외 던지기
            throw new ProjectTransactionException();
        }

        // 3) 저장된 엔티티 전체를 DTO로 변환해 반환
        return CreateStepResponseDto.fromEntity(savedStep);
    }

    async createPost(
        dto: CreatePostDto,
        userId: number,
        projectId: number
    ): Promise<CreatePostResponseDto> {
        // 1) 프로젝트 존재 확인, 프로젝트 멤버인지 확인
        await this.assertProjectExists(projectId);
        await this.checkProjectMember(userId, projectId);

        // 2) Redis에서 기존 포스트잇 로드 (string or null)
        const key = this.POSTS_KEY(projectId);
        const raw = await this.redis.get(key);

        // 3) string → 객체 배열로 파싱
        let posts: RedisPost[] = [];
        if (raw) {
            try {
                posts = JSON.parse(raw) as CreatePostResponseDto[];
            } catch {
                throw new RedisDataParseException();
            }
        }

        // 4) 최대 10개 제한
        if (posts.length >= 10) {
            throw new PostsExceededException();
        }

        // 5) 새 ID 생성
        const newId = posts.length > 0 ? Math.max(...posts.map((p) => p.id)) + 1 : 1;

        // 6) 새 포스트잇 객체
        const newPost: RedisPost = {
            id: newId,
            userId,
            content: dto.content,
            createdAt: new Date().toISOString(),
        };

        // 7) 배열에 추가
        posts.push(newPost);

        // 8) 다시 JSON.stringify 후 저장
        await this.redis.set(key, JSON.stringify(posts));
        await this.redis.expire(key, this.POST_TTL_SECONDS);
        // 10) 생성된 객체 반환
        return CreatePostResponseDto.fromEntity(newPost, projectId);
    }

    async deletePost(
        postId: number,
        userId: number,
        projectId: number
    ): Promise<DeletePostResponseDto> {
        await this.checkProjectMember(userId, projectId);
        const key = this.POSTS_KEY(projectId);
        const postsRaw = await this.redis.get(key);

        if (!postsRaw) {
            throw new PostNotFoundException();
        }

        let posts: any[];
        try {
            posts = JSON.parse(postsRaw);
        } catch {
            throw new RedisDataParseException();
        }

        const postIndex = posts.findIndex((post) => post.id === postId);

        if (postIndex === -1) {
            throw new PostNotFoundException();
        }

        const post = posts[postIndex];
        if (post.userId !== userId) {
            throw new NotPostAuthorException();
        }

        posts.splice(postIndex, 1); // 삭제

        await this.redis.set(key, JSON.stringify(posts)); // 갱신
        await this.redis.expire(key, this.POST_TTL_SECONDS); // TTL 재설정

        const message = '포스트잇이 삭제되었습니다.';

        return DeletePostResponseDto.fromEntity(message);
    }

    async changeProjectLeader(
        qr: QueryRunner,
        projectId: number,
        dto: ChangeLeaderDto,
        currentUserId: number
    ): Promise<ChangeLeaderResponseDto> {
        await this.assertProjectIsEditable(projectId);
        await this.checkProjectLeader(currentUserId, projectId);
        const { newLeaderId } = dto;
        const newId = newLeaderId;

        // 1) 자기 자신 지목 방지
        if (currentUserId === newId) {
            throw new ForbiddenSelfAssignException();
        }

        // 2) 현재 팀장 ID만 조회
        const currentLeaderRaw = await this.userProjectRepository
            .createQueryBuilder('up')
            .select('up.userId', 'oldLeaderId') // alias: oldLeaderId
            .where('up.projectId = :projectId', { projectId })
            .andWhere('up.permission = :perm', { perm: projectPermission.LEAD })
            .getRawOne<{ oldLeaderId: number }>();

        // 3) 이미 팀장인 경우 방지
        if (currentLeaderRaw?.oldLeaderId === newId) {
            throw new AlreadyLeaderException();
        }

        try {
            // 4) 기존 팀장 MEMBER로 강등
            if (currentLeaderRaw) {
                await qr.manager.update(
                    UserProject,
                    { user: { id: currentLeaderRaw.oldLeaderId }, project: { id: projectId } },
                    { permission: projectPermission.MEMBER }
                );
            }

            // 5) 새 팀장 LEAD로 승격
            await qr.manager.update(
                UserProject,
                { user: { id: newLeaderId }, project: { id: projectId } },
                { permission: projectPermission.LEAD }
            );
        } catch (err) {
            // 트랜잭션 예외 발생 시 롤백하도록 인터셉터가 처리하고,
            // 여기서는 도메인 예외로 래핑
            throw new ProjectTransactionException();
        }

        // 7) 응답 반환 (permission은 LEAD로 고정)
        return ChangeLeaderResponseDto.fromEntity(newId, projectPermission.LEAD);
    }

    async updateProfile(
        qr: QueryRunner,
        projectId: number,
        userId: number,
        dto: UpdateProfileDto
    ): Promise<UpdateProfileResponseDto> {
        // 프로젝트 완료 여부 검사
        await this.assertProjectIsEditable(projectId);
        // 1. 본인 프로필 수정인지 확인
        if (userId !== dto.id) {
            throw new ProfileForbiddenException();
        }

        // 2. 해당 UserProject 매핑 가져오기
        const userProject = await this.userProjectRepository.findOne({
            where: {
                project: { id: projectId },
                user: { id: dto.id },
            },
        });

        if (!userProject) {
            throw new ProjectForbiddenException();
        }
        try {
            // 3. role 수정 후 저장
            userProject.role = dto.role;
            await qr.manager.save(userProject);
        } catch (err) {
            throw new ProjectTransactionException();
        }

        // 4. 전체 userProject 조회 (task 정보 포함)
        const allUserProjects = await qr.manager.find(UserProject, {
            where: { project: { id: projectId } },
            relations: ['user', 'user.managers', 'user.managers.task'],
        });

        // 5. DTO 변환 및 응답 반환
        const users = allUserProjects.map(UserInProjectDto.from);

        return UpdateProfileResponseDto.fromEntity(users);
    }

    // 프로젝트가 수정 가능한 상태인지 확인하는 메서드(이미 완료된 프로젝트는 수정할 수 없음)
    async assertProjectIsEditable(projectId: number): Promise<Project> {
        const project = await this.projectRepository.findOne({ where: { id: projectId } });
        if (!project) throw new ProjectNotFoundException();
        if (project.isCompleted) throw new AlreadyProjectCompletedException();
        return project;
    }
    // 프로젝트 존재 여부 확인
    async assertProjectExists(projectId: number): Promise<Project> {
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            relations: [
                'userProjects',
                'userProjects.user',
                'userProjects.user.managers',
                'userProjects.user.managers.task',
            ],
        });
        if (!project) {
            throw new ProjectNotFoundException();
        }
        return project;
    }
    // 프로젝트 멤버 확인 + 팀장 권한 확인
    async checkProjectLeader(userId: number, projectId: number) {
        const mapping = await this.userProjectRepository
            .createQueryBuilder('up')
            .select(['up.permission']) // permission만 조회
            .where('up.userId = :userId', { userId })
            .andWhere('up.projectId = :projectId', { projectId })
            .getOne();

        if (!mapping) {
            throw new ProjectForbiddenException(); // 멤버 아님
        }

        if (mapping.permission !== projectPermission.LEAD) {
            throw new ProjectUpdateForbiddenException('해당 부분은 팀장만 수정할 수 있습니다.');
        }
        return !!mapping;
    }

    // 프로젝트 멤버인지만 확인
    async checkProjectMember(userId: number, projectId: number) {
        const mapping = await this.userProjectRepository.findOne({
            where: {
                user: { id: userId },
                project: { id: projectId },
            },
        });
        if (!mapping) throw new ProjectForbiddenException();
        return !!mapping;
    }

    // 참여코드로 프로젝트 id 조회
    private async getProjectByInviteCode(inviteCode: string) {
        const key = `invite:${inviteCode}`;
        const projectIdStr = await this.redis.get(key);
        if (projectIdStr == null) return null; //키가 없으면 null 리턴
        // 숫자로 변환
        const projectId = Number(projectIdStr);
        return projectId;
    }

    // user와 project 매핑 존재 확인
    private async isUserInProject(userId: number, projectId: number): Promise<boolean> {
        return await this.userProjectRepository.exists({
            where: { user: { id: userId }, project: { id: projectId } },
        });
    }

    // user를 project 멤버로 추가
    private async addUserToProject(
        userId: number,
        projectId: number,
        role: string,
        qr
    ): Promise<void> {
        let userProject!: UserProject;
        try {
            const userProject = qr.manager.create(UserProject, {
                user: { id: userId },
                project: { id: projectId },
                permission: projectPermission.MEMBER,
                role,
            });
        } catch (err) {
            throw new ProjectTransactionException();
        }
        await this.userProjectRepository.save(userProject);
    }
}

export function generateRandomCode(length = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
