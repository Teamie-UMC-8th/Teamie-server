import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/projects.entity';
import { UserProject } from '../mappings/user-projects/userProjects.entity';
import { Repository } from 'typeorm';
import { projectPermission } from 'src/common/enums/project-permission.enum';
import { CreateProjectDto, CreateProjectResponseDto } from './dtos/create-project.dto';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { CommonResponse } from '../../common/response/common-response.dto';
import { UserInProjectDto, AllProjectResponseDto, PostDto } from './dtos/all-project-response.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { CompleteProjectResponseDto } from './dtos/complete-project.dto';
import { PersonalRecall } from '../personal-recalls/entities/personal-recalls.entity';
import {
    AlreadyProjectCompletedException,
    ProjectNotFoundException,
} from 'src/common/exceptions/custom.errors';
import { Step } from '../steps/entities/steps.entity';
import { CreateStepDto, CreateStepResponseDto } from '../steps/dtos/create-step.dto';
import { StepWithTaskDto } from '../steps/dtos/step-with-task.dto';
import { StepResponseDto } from './dtos/project-with-steps.dto';
import { StepsService } from '../steps/steps.service';
@Injectable()
export class ProjectsService {
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
        private readonly redis: Cache,
        private readonly configService: ConfigService,
        private readonly stepsService: StepsService
    ) {}

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
        await this.redis.set(key, savedProject.id.toString(), ttlSeconds);

        const baseUrl = this.configService.get('BASE_URL');
        const inviteCode = `${baseUrl}/projects/join/${code}`;

        return CommonResponse.success(CreateProjectResponseDto.fromEntity(project, inviteCode));
    }

    async getProjectByInviteCode(inviteCode: string): Promise<Project | null> {
        const key = `invite:${inviteCode}`;
        const projectId = await this.redis.get<Project>(key);
        return projectId || null;
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
    ): Promise<CreateStepResponseDto> {
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
        return CreateStepResponseDto.fromEntity(saved);
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
