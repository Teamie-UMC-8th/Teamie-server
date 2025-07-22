import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/projects.entity';
import { UserProject } from '../mappings/user-projects/userProjects.entity';
import { Repository } from 'typeorm';
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
    NotMemberException,
    AlreadyLeaderException,
    ForbiddenSelfAssignException,
} from 'src/common/exceptions/custom.errors';
import { Step } from '../steps/entities/steps.entity';
import { CreateStepDto, CreateStepResponseDto } from '../steps/dtos/create-step.dto';
import { StepsService } from '../steps/steps.service';
import { CreatePostDto, CreatePostResponseDto } from './dtos/create-post.dto';
import { DeletePostResponseDto } from './dtos/delete-post-response.dto';
import { RedisClientType } from 'redis';
import { ChangeLeaderResponseDto } from './dtos/change-leader.dto';
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

        @Inject('REDIS_CLIENT')
        private readonly redis: RedisClientType,
        private readonly configService: ConfigService,
        private readonly stepsService: StepsService
    ) {
        this.postsKeyPrefix = this.configService.get<string>('POSTS_KEY_PREFIX', 'posts');
        const ttlStr = this.configService.get<string>('POST_TTL_SECONDS', `${48 * 3600}`);
        //숫자로 변환해서 실제 필드에 할당
        this.POST_TTL_SECONDS = parseInt(ttlStr, 10);
    }

    async createProject(
        dto: CreateProjectDto,
        userId: number
    ): Promise<CommonResponse<CreateProjectResponseDto>> {
        const { name } = dto;
        const project = this.projectRepository.create({
            name,
            goal: '',
            rule: '',
            isCompleted: false,
            completedAt: undefined,
        });

        const savedProject = await this.projectRepository.save(project);

        const userProject = this.userProjectRepository.create({
            user: { id: userId }, // User 엔티티의 id를 사용하여 관계 설정
            project: savedProject,
            permission: projectPermission.LEAD,
            role: '',
        });

        await this.userProjectRepository.save(userProject);

        const code = generateRandomCode();
        const key = `invite:${code}`;
        const ttlSeconds = 60 * 60 * 24 * 7; //7일
        await this.redis.set(key, savedProject.id.toString());
        await this.redis.expire(key, ttlSeconds);

        const baseUrl = this.configService.get('BASE_URL');
        const inviteCode = `${baseUrl}/projects/join/${code}`;

        return CommonResponse.success(CreateProjectResponseDto.fromEntity(project, inviteCode));
    }

    async getProjectByInviteCode(inviteCode: string): Promise<Project | null> {
        const key = `invite:${inviteCode}`;
        const projectId = await this.redis.get(key);
        const project = await this.projectRepository.findOne({ where: { id: Number(projectId) } });
        return project;
    }

    async isUserInProject(userId: number, projectId: number): Promise<boolean> {
        return await this.userProjectRepository.exists({
            where: { user: { id: userId }, project: { id: projectId } },
        });
    }

    async addUserToProject(userId: number, projectId: number, role: string): Promise<void> {
        const userProject = this.userProjectRepository.create({
            user: { id: userId },
            project: { id: projectId },
            permission: projectPermission.MEMBER,
            role,
        });
        await this.userProjectRepository.save(userProject);
    }

    async getProjectFullData(projectId: number): Promise<CommonResponse<AllProjectResponseDto>> {
        const project = await this.assertProjectExists(projectId);

        const userProjects = await this.userProjectRepository.find({
            where: { project: { id: projectId } },
            relations: ['user', 'user.managers', 'user.managers.task'],
        });

        const users = userProjects.map(UserInProjectDto.from);

        const key = `posts:${projectId}`;
        const postsRaw = (await this.redis.get(key)) || [];
        const posts = Array.isArray(postsRaw) ? postsRaw.map(PostDto.from) : [];

        return CommonResponse.success(AllProjectResponseDto.fromEntity({ project, users, posts }));
    }

    async checkProjectMembership(userId: number, projectId: number): Promise<boolean> {
        const mapping = await this.userProjectRepository.findOne({
            where: { user: { id: userId }, project: { id: projectId } },
        });
        return !!mapping;
    }

    async updateProject(
        projectId: number,
        dto: UpdateProjectDto
    ): Promise<CommonResponse<AllProjectResponseDto>> {
        const project = await this.assertProjectIsEditable(projectId);

        // 해당 필드들만 조건부로 갱신
        if (dto.name !== undefined) project.name = dto.name;
        if (dto.rule !== undefined) project.rule = dto.rule;
        if (dto.goal !== undefined) project.goal = dto.goal;

        await this.projectRepository.save(project);

        return this.getProjectFullData(projectId);
    }
    async checkProjectLeader(userId: number, projectId: number): Promise<boolean> {
        const mapping = await this.userProjectRepository.findOne({
            where: {
                user: { id: userId },
                project: { id: projectId },
                permission: projectPermission.LEAD,
            },
        });
        return !!mapping;
    }

    async completeProject(projectId: number): Promise<CommonResponse<CompleteProjectResponseDto>> {
        const project = await this.assertProjectIsEditable(projectId);
        // 프로젝트 완료 상태로 변경
        project.isCompleted = true;
        project.completedAt = new Date(); // 현재 시간으로 설정
        const members = await this.userProjectRepository.find({
            where: { project: { id: projectId } },
            relations: ['user'],
        });

        // 각 멤버에 대해 personalRecall 생성
        for (const member of members) {
            await this.personalRecallRepository.save({
                user: { id: member.user.id },
                project: { id: projectId },
                q1: '',
                q2: '',
                q3: '',
            });
        }
        return CommonResponse.success(CompleteProjectResponseDto.fromEntity(project));
    }

    async createStep(
        dto: CreateStepDto,
        projectId: number,
        userId: number
    ): Promise<CommonResponse<CreateStepResponseDto>> {
        // 1) 엔티티 생성
        const step = this.stepRepository.create({
            ...dto,
        });

        // Assign relations separately if needed
        (step as any).project = { id: projectId };
        (step as any).createdBy = { id: userId };

        // 2) 실제로 DB에 저장
        const saved = await this.stepRepository.save(step);

        // 3) 저장된 엔티티 전체를 DTO로 변환해 반환
        return CommonResponse.success(CreateStepResponseDto.fromEntity(saved));
    }

    async createPost(
        dto: CreatePostDto,
        userId: number,
        projectId: number
    ): Promise<CommonResponse<CreatePostResponseDto>> {
        // 1) 프로젝트 존재 확인
        await this.assertProjectExists(projectId);

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

        // 9) 생성된 객체 반환
        return CommonResponse.success(CreatePostResponseDto.fromEntity(newPost, projectId));
    }

    async deletePost(
        postId: number,
        userId: number,
        projectId: number
    ): Promise<CommonResponse<DeletePostResponseDto>> {
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

        return CommonResponse.success({ message: '포스트잇이 삭제되었습니다.' });
    }

    async changeProjectLeader(
        projectId: number,
        userId: number,
        currentUserId: number
    ): Promise<CommonResponse<ChangeLeaderResponseDto>> {
        await this.assertProjectIsEditable(projectId);

        // 1) 자기 자신 지목 방지
        if (userId === currentUserId) {
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
        if (currentLeaderRaw?.oldLeaderId === userId) {
            throw new AlreadyLeaderException();
        }

        // 4) 기존 팀장 MEMBER로 강등
        if (currentLeaderRaw) {
            await this.userProjectRepository.update(
                {
                    user: { id: currentLeaderRaw.oldLeaderId },
                    project: { id: projectId },
                },
                { permission: projectPermission.MEMBER }
            );
        }

        // 5) 새 팀장이 프로젝트 멤버인지 확인
        const membership = await this.userProjectRepository.findOne({
            where: { user: { id: userId }, project: { id: projectId } },
        });
        if (!membership) {
            throw new NotMemberException();
        }

        // 6) 새 팀장 LEAD로 업데이트
        await this.userProjectRepository.update(
            { user: { id: userId }, project: { id: projectId } },
            { permission: projectPermission.LEAD }
        );

        // 7) 응답 반환 (permission은 LEAD로 고정)
        return CommonResponse.success(
            ChangeLeaderResponseDto.fromEntity(userId, projectPermission.LEAD)
        );
    }
    // 프로젝트가 수정 가능한 상태인지 확인하는 메서드
    // 이미 완료된 프로젝트는 수정할 수 없음
    private async assertProjectIsEditable(projectId: number): Promise<Project> {
        const project = await this.projectRepository.findOne({ where: { id: projectId } });
        if (!project) throw new AlreadyProjectCompletedException();
        if (project.isCompleted) throw new AlreadyProjectCompletedException();
        return project;
    }
    private async assertProjectExists(projectId: number): Promise<Project> {
        const project = await this.projectRepository.findOne({ where: { id: projectId } });
        if (!project) throw new ProjectNotFoundException();
        return project;
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
