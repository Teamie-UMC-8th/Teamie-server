import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { projectPermission } from 'src/common/enums/project-permission.enum';
import { CreateProjectDto, CreateProjectResponseDto } from '../dtos/create-project.dto';
import { ConfigService } from '@nestjs/config';
import { UserInProjectDto, AllProjectResponseDto, PostDto } from '../dtos/all-project-response.dto';
import { UpdateProjectDto } from '../dtos/update-project.dto';
import { CompleteProjectResponseDto } from '../dtos/complete-project.dto';
import { PersonalRecall } from '../../personal-recalls/entities/personal-recalls.entity';
import {
    PostsExceededException,
    PostNotFoundException,
    NotPostAuthorException,
    ProjectUpdateForbiddenException,
    ProfileForbiddenException,
    ProjectTransactionException,
    AlreadyJoinException,
    InvalidDateException,
    ProjectForbiddenException,
} from 'src/common/exceptions/custom.errors';
import { Step } from '../../steps/entities/steps.entity';
import { CreateStepDto, CreateStepResponseDto } from '../../steps/dtos/create-step.dto';
import { CreatePostDto, CreatePostResponseDto } from '../dtos/create-post.dto';
import { DeletePostResponseDto } from '../dtos/delete-post-response.dto';
import { MasterPortfoliosService } from '../../master-portfolios/services/master-portfolios.service';
import { ChangeLeaderDto, ChangeLeaderResponseDto } from '../dtos/change-leader.dto';
import { User } from '../../users/entities/users.entity';
import { UpdateProfileDto, UpdateProfileResponseDto } from '../dtos/update-profile.dto';
import { JoinProjectDto, JoinProjectResponseDto } from '../dtos/join-project.dto';
import { ValidateInviteResponseDto } from '../dtos/validate-invite.dto';
import { PlansService } from '../../plans/services/plans.service';
import { TasksService } from '../../tasks/services/tasks.service';
import {
    CalenderCardResponseDto,
    TeamCalenderResponseDto,
} from '../dtos/team-calender-response.dto';
import { InviteCodeStore } from '../repositories/invite-code.store';
import { ProjectRepository } from '../repositories/project.repository';
import { PostsStore } from '../repositories/posts.store';
import { Project } from '../entities/projects.entity';
import { UserProfile } from 'src/common/dtos/user-profile.dto';
import { UserProjectRepository } from '../repositories/user-project.repository';
import { map } from 'rxjs';
@Injectable()
export class ProjectsService {
    private readonly postsKeyPrefix: string;
    private readonly POSTS_KEY = (projectId: number) => `${this.postsKeyPrefix}:${projectId}`;
    private readonly POST_TTL_SECONDS: number;
    private readonly POST_MAX: number;
    constructor(
        private readonly projectRepository: ProjectRepository,
        private readonly userProjectRepository: UserProjectRepository,

        @InjectRepository(PersonalRecall)
        private readonly personalRecallRepository: Repository<PersonalRecall>,

        @InjectRepository(Step)
        private readonly stepRepository: Repository<Step>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        private readonly inviteStore: InviteCodeStore,
        private readonly configService: ConfigService,
        private readonly postsStore: PostsStore,
        private readonly masterPortfoliosService: MasterPortfoliosService,
        private readonly plansService: PlansService,
        private readonly tasksService: TasksService
    ) {
        this.postsKeyPrefix = this.configService.get<string>('POSTS_KEY_PREFIX', 'posts');
        const ttlStr = this.configService.get<string>('POST_TTL_SECONDS', `${48 * 3600}`);
        //숫자로 변환해서 실제 필드에 할당
        this.POST_TTL_SECONDS = parseInt(ttlStr, 10);
        this.POST_MAX = this.configService.get<number>('POST_MAX', 16);
    }

    async createProject(
        qr: QueryRunner,
        dto: CreateProjectDto,
        userId: number
    ): Promise<CreateProjectResponseDto> {
        const { name } = dto;

        let savedProject: Project;
        try {
            savedProject = await this.projectRepository.createProjectWithLeader(name, qr.manager);
        } catch (e) {
            throw e; // 인터셉터에서 롤백됨
        }
        await this.userProjectRepository.updateUserRole(
            userId,
            savedProject.id,
            projectPermission.LEAD,
            qr.manager
        );

        const { code, expiresAt } = await this.inviteStore.saveActive(
            savedProject.id,
            this.POST_TTL_SECONDS
        );
        await this.inviteStore.saveMeta(code, savedProject.id);

        return CreateProjectResponseDto.fromEntity(savedProject, code, expiresAt);
    }

    async joinValidate(userId: number, inviteCode: string): Promise<ValidateInviteResponseDto> {
        // 1) 초대 코드 유효성 검사 (Expired vs Invalid 예외 포함)
        const projectId = await this.inviteStore.findProjectByInviteCode(inviteCode);

        // 2) 이미 참여한 사용자라면 예외
        const alreadyJoined = await this.userProjectRepository.isUserInProject(userId, projectId);
        if (alreadyJoined) {
            throw new AlreadyJoinException();
        }

        // 3) 프로젝트 이름 조회
        const project = await this.projectRepository.findProjectName(projectId);
        // 4) DTO 반환 (새로 참여하는 사용자는 MEMBER 권한)
        return ValidateInviteResponseDto.fromEntity(
            projectId,
            project.name,
            projectPermission.MEMBER
        );
    }

    async joinProject(
        qr: QueryRunner,
        userId: number,
        dto: JoinProjectDto
    ): Promise<JoinProjectResponseDto> {
        const projectId = dto.projectId;
        //  프로젝트 엔티티에서 이름 조회
        const project = await this.projectRepository.findProjectName;
        //  유저 엔티티에서 이름 조회
        const user = await this.userRepository.findOneOrFail({
            where: { id: userId },
            select: ['id', 'name'],
        });
        //  아직 참여하지 않았다면 member로 추가
        const alreadyJoined = await this.userProjectRepository.isUserInProject(userId, projectId);
        if (!alreadyJoined) {
            await this.userProjectRepository.saveMemberToProject(
                userId,
                projectId,
                'member',
                qr.manager
            );
        }
        const message = `${user.name}님이 "${project.name}" 프로젝트에 참여되었습니다.`;
        const responseDto = JoinProjectResponseDto.fromEntity(message);

        return responseDto;
    }

    async getProjectFullData(userId: number, projectId: number): Promise<AllProjectResponseDto> {
        // 프로젝트 존재 검사
        const project = await this.projectRepository.isProjectExist(projectId);
        // 프로젝트 멤버 권한 검사
        await this.isProjectMember(userId, projectId);

        const postsRaw = await this.postsStore.findPosts(projectId, this.postsKeyPrefix);
        const posts = Array.isArray(postsRaw) ? postsRaw.map(PostDto.from) : [];

        return AllProjectResponseDto.fromEntity({ project, posts });
    }

    async updateProject(
        qr: QueryRunner,
        userId: number,
        projectId: number,
        dto: UpdateProjectDto
    ): Promise<AllProjectResponseDto> {
        //프로젝트 존재 검사
        const project = await this.projectRepository.isProjectEditable(projectId);
        //프로젝트 팀장 여부
        const isLead = await this.isProjectLeader(userId, projectId);

        // rule, goal은 팀장만 수정 가능
        if ((!isLead && dto.rule !== undefined) || (!isLead && dto.goal !== undefined)) {
            throw new ProjectUpdateForbiddenException();
        }
        // 해당 필드들만 조건부로 갱신
        if (dto.name !== undefined) project.name = dto.name;
        if (dto.rule !== undefined) project.rule = dto.rule;
        if (dto.goal !== undefined) project.goal = dto.goal;

        await this.projectRepository.saveProject(project, qr.manager);

        return this.getProjectFullData(userId, projectId);
    }

    async completeProject(
        qr: QueryRunner,
        userId: number,
        projectId: number
    ): Promise<CompleteProjectResponseDto> {
        // 1) 프로젝트 존재 검사 & 수정 가능 확인
        let project = await this.projectRepository.isProjectEditable(projectId);
        // 2) 팀장 권한 확인
        await this.userProjectRepository.isProjectLeader(userId, projectId);

        // 3) 프로젝트 완료 처리
        project.isCompleted = true;
        project.completedAt = new Date();

        try {
            // 3-1) 프로젝트 저장
            project = await this.projectRepository.saveProject(project, qr.manager);

            // 3-2) 모든 멤버의 projectNum + 1
            await this.userProjectRepository.updateProjectNum(projectId, qr.manager);

            // 3-3) PersonalRecall 생성 (create → save)
            const recall = qr.manager.create(PersonalRecall, {
                user: { id: userId },
                project: { id: projectId },
            });
            await qr.manager.save(PersonalRecall, recall);
        } catch (err) {
            throw new ProjectTransactionException();
        }

        // 4) 트랜잭션 넘겨서 MasterPortfolio 생성
        await this.masterPortfoliosService.createMasterPortfolio(qr.manager, userId, projectId);

        // 5) 초대코드 정리 (InviteCodeStore 사용)
        const codes = await this.inviteStore.listCodesByProject(projectId);
        if (codes.length) {
            await this.inviteStore.removeCodes(codes); // invite:<code> 삭제 (meta는 유지)
            await this.inviteStore.clearProjectSet(projectId); // project:<id>:invites 세트 삭제
        }
        await this.postsStore.deletePosts(projectId, this.postsKeyPrefix);

        // 6) 응답 반환
        return CompleteProjectResponseDto.fromEntity(project);
    }
    async createStep(
        qr: QueryRunner,
        dto: CreateStepDto,
        projectId: number,
        userId: number
    ): Promise<CreateStepResponseDto> {
        // 프로젝트 멤버인지 확인
        await this.isProjectMember(userId, projectId);
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
        await this.projectRepository.isProjectExist(projectId);
        await this.isProjectMember(userId, projectId);

        // 2) Redis에서 기존 포스트잇 로드
        const posts = await this.postsStore.findPosts(projectId, this.postsKeyPrefix);

        // 4) 최대 개수 제한
        if (posts.length >= this.POST_MAX) throw new PostsExceededException();

        const newPost = await this.postsStore.savePost(
            projectId,
            this.postsKeyPrefix,
            { userId, content: dto.content }, // ← userId 전달
            this.POST_TTL_SECONDS,
            this.POST_MAX
        );
        // 10) 생성된 객체 반환
        return CreatePostResponseDto.fromEntity(newPost, projectId);
    }

    async deletePost(
        postId: number,
        userId: number,
        projectId: number
    ): Promise<DeletePostResponseDto> {
        await this.isProjectMember(userId, projectId);
        const key = this.POSTS_KEY(projectId);
        const res = await this.postsStore.deletePost(
            projectId,
            this.postsKeyPrefix,
            postId,
            userId, // ← 작성자 검증에 사용
            this.POST_TTL_SECONDS
        );
        if (res === 'NOT_FOUND') throw new PostNotFoundException();
        if (res === 'NOT_OWNER') throw new NotPostAuthorException();
        const message = '포스트잇이 삭제되었습니다.';

        return DeletePostResponseDto.fromEntity(message);
    }

    async changeProjectLeader(
        qr: QueryRunner,
        projectId: number,
        dto: ChangeLeaderDto,
        currentUserId: number
    ): Promise<ChangeLeaderResponseDto> {
        await this.projectRepository.isProjectEditable(projectId);
        await this.isProjectMember(currentUserId, projectId);
        const { newLeaderId } = dto;
        const newId = newLeaderId;
        const current = await this.userProjectRepository.findProjectLeaderByProjectId(projectId);
        if (current?.oldLeaderId === newLeaderId) {
            throw new ProjectUpdateForbiddenException('이미 팀장입니다.');
        }
        // 지목된 사람 권한을 LEAD로 변경
        await this.userProjectRepository.updateUserRole(
            projectId,
            newLeaderId,
            projectPermission.LEAD,
            qr.manager
        );

        // 5) 응답 반환 (permission은 LEAD로 고정)
        return ChangeLeaderResponseDto.fromEntity(newId, projectPermission.LEAD);
    }

    async updateProfile(
        qr: QueryRunner,
        projectId: number,
        userId: number,
        dto: UpdateProfileDto
    ): Promise<UpdateProfileResponseDto> {
        // 프로젝트 완료 여부 검사
        await this.projectRepository.isProjectEditable(projectId);
        // 1. 본인 프로필 수정인지 확인
        if (userId !== dto.id) {
            throw new ProfileForbiddenException();
        }

        await this.userProjectRepository.updateUserRole(projectId, userId, dto.role, qr.manager);

        // 4. 전체 userProject 조회 (task 정보 포함)
        const allUserProjects = await this.userProjectRepository.findAllUserProjectsByProjectId(
            projectId,
            qr.manager
        );

        // 5. DTO 변환 및 응답 반환
        const users = allUserProjects.map(UserInProjectDto.from);

        return UpdateProfileResponseDto.fromEntity(users);
    }

    async getTeamCalender(userId: number, projectId: number, startDate: string, endDate: string) {
        //검색 범위 제한 - 최대 31일
        const start = new Date(startDate);
        const end = new Date(endDate);

        const diffInMs = end.getTime() - start.getTime();
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

        if (diffInDays > 31) {
            throw new InvalidDateException({
                startDate: startDate,
                endDate: endDate,
            });
        }

        //팀캘린더 조회
        //1. tasks 카드 조회
        const tasks: Record<string, CalenderCardResponseDto[]> =
            await this.tasksService.getTasksByDeadline(projectId, start, end);
        //2. plans 카드 조회
        const plans: Record<string, CalenderCardResponseDto[]> =
            await this.plansService.getPlansByDate(projectId, start, end);
        //3. Grouping && DTO 조립
        const mergedMap = new Map<string, CalenderCardResponseDto[]>();

        for (const [date, list] of Object.entries(tasks)) {
            mergedMap.set(date, [...list]);
        }

        for (const [date, list] of Object.entries(plans)) {
            if (mergedMap.has(date)) {
                mergedMap.get(date)!.push(...list);
            } else {
                mergedMap.set(date, [...list]);
            }
        }

        const mergedArray: TeamCalenderResponseDto[] = Array.from(mergedMap.entries())
            .map(([date, list]) => TeamCalenderResponseDto.fromEntity({ date, list }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return mergedArray;
    }

    async getProjectMemberList(projectId: number): Promise<UserProfile[]> {
        const userProjects =
            await this.userProjectRepository.findAllUserProjectsByProjectId(projectId);
        return userProjects.map((up) => UserProfile.from(up.user));
    }

    async isProjectMember(userId: number, projectId: number): Promise<boolean> {
        const mapping = this.userProjectRepository.isUserInProject(userId, projectId);
        if (!mapping) throw new ProjectForbiddenException();
        return true;
    }

    async isProjectExists(projectId: number): Promise<Project> {
        return this.projectRepository.isProjectExist(projectId);
    }

    async isProjectLeader(userId: number, projectId: number): Promise<boolean> {
        const mapping = await this.userProjectRepository.isProjectLeader(userId, projectId);

        if (!mapping) throw new ProjectForbiddenException();
        if (mapping !== projectPermission.LEAD) {
            throw new ProjectUpdateForbiddenException('해당 부분은 팀장만 수정할 수 있습니다.');
        }
        return true;
    }
}
