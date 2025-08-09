import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from '../entities/tasks.entity';
import { Repository, In } from 'typeorm';
import { Step } from '../../steps/entities/steps.entity';
import { UserProject } from '../../mappings/user-projects/userProjects.entity';
import { User } from '../../users/entities/users.entity';
import { CreateTaskRequestDto, CreateTaskResponseDto } from '../dtos/create-task.dto';
import {
    CreateCommentResponseDto,
    CreateCommentRequestDto,
} from '../../comments/dto/create-comment.dto';
import { UpdateTaskRequestDto, UpdateTaskResponseDto } from '../dtos/update-task.dto';
import { Manager } from '../../mappings/managers/managers.entity';
import { Project } from '../../projects/entities/projects.entity';
import { DeleteTaskResponseDto } from '../dtos/delete-task.dto';
import { TaskFile } from '../../mappings/task-files/task-files.entity';
import { Comment as CommentEntity } from '../../comments/entities/comments.entity';
import { GetTaskResponseDto } from '../dtos/get-task.dto';
import { UploadService } from '../../../infra/upload/upload.service';
import { TaskDashboardStepViewDto } from '../dtos/task-dashboard-step-view-dto';
import { TaskDashboardStatusViewDto } from '../dtos/task-dashboard-status-view-dto';
import { TaskInStepDto } from '../dtos/task-dashboard-step-view-dto';
import { TaskInStatusDto } from '../dtos/task-dashboard-status-view-dto';
import { CreateTaskFileResponseDto } from '../../mappings/task-files/dtos/create-task-files.dto';
import { GetCommentResponseDto } from '../../comments/dto/get-comment.dto';
import { Status } from '../../../common/enums/status.enum';
import { TaskNotFoundException, BadRequestException } from 'src/common/exceptions/custom.errors';
import { QueryRunner } from 'typeorm';
import { CalenderCardResponseDto } from '../../projects/dtos/team-calender-response.dto';
import { UsersService } from '../../users/services/users.service';
import { ProjectDashBoardDTO, TaskCardDTO } from '../dtos/user-task.dto';
import { ConfigService } from '@nestjs/config';
import { PaginatedResponseDto } from 'src/common/response/paginated-response.dto';
import { GetSearchTaskDto } from '../dtos/get-search-task.dto';
import { Brackets } from 'typeorm';
import { TaskRepository } from '../repositories/task.repository';
import { ProjectsService } from '../../projects/services/projects.service';
import { StepRepository } from '../../steps/repositories/step.repository';
import { ManagerRepository } from '../../mappings/managers/repositories/manager.repository';
import { TaskFileRepository } from '../../mappings/task-files/repositories/task-file.repository';
import { CommentRepository } from '../../comments/repositories/comments.repository';

@Injectable()
export class TasksService {
    constructor(
        private readonly taskRepository: TaskRepository,

        private readonly stepRepository: StepRepository,

        private readonly managerRepository: ManagerRepository,

        private readonly taskFileRepository: TaskFileRepository,

        private readonly uploadService: UploadService,

        private readonly commentRepository: CommentRepository,

        private readonly usersService: UsersService,

        private readonly configService: ConfigService,

        @Inject(forwardRef(() => ProjectsService))
        private readonly projectsService: ProjectsService
    ) {}

    async createTask(
        queryRunner: QueryRunner,
        userId: number,
        createTaskRequestDto: CreateTaskRequestDto
    ): Promise<CreateTaskResponseDto> {
        const { stepId } = createTaskRequestDto;

        // Step 조회
        const targetStep = await this.stepRepository.findByIdWithQueryRunner(queryRunner, stepId);

        // 프로젝트 참여 여부 검증
        const projectId = targetStep.project.id;
        await this.projectsService.checkProjectMember(userId, projectId);

        // 업무 생성
        const task = await this.taskRepository.createTaskWithQueryRunner(queryRunner, targetStep);

        return CreateTaskResponseDto.fromEntity(task);
    }

    async updateTask(
        queryRunner: QueryRunner,
        userId: number,
        taskId: number,
        dto: UpdateTaskRequestDto
    ): Promise<UpdateTaskResponseDto> {
        // 1. 수정할 Task 조회
        const task = await this.taskRepository.findByIdWithQueryRunner(queryRunner, taskId);

        // 2. 새 Step 조회
        const newStep = await this.stepRepository.findByIdWithQueryRunner(queryRunner, dto.stepId);

        // 프로젝트 참여 여부 검증
        await this.projectsService.checkProjectMember(userId, newStep.project.id);

        // 4. Task 필드 덮어쓰기
        task.step = newStep;
        task.name = dto.name;
        task.deadline = dto.deadline;
        task.status = dto.status;
        task.memo = dto.memo;

        const updatedTask = await this.taskRepository.saveWithQueryRunner(queryRunner, task);

        // managerIds가 있으면: 존재 + 프로젝트 멤버십 배치 검증 (기존 함수 그대로)
        if (dto.managerIds?.length) {
            const uniqueManagerIds = Array.from(new Set(dto.managerIds));

            await this.usersService.checkIsUserExistByArray(uniqueManagerIds, newStep.project.id);

            // 1) 기존 전부 삭제
            await this.managerRepository.deleteManagerWithQueryRunner(queryRunner, updatedTask.id);

            // 2) 새 매니저 엔티티들 생성
            const managers = uniqueManagerIds.map((uid) =>
                queryRunner.manager.create(Manager, {
                    task: updatedTask,
                    user: { id: uid },
                })
            );

            // 3) 배치 저장
            await this.managerRepository.saveManagersWithQueryRunner(queryRunner, managers);
        } else {
            // 없으면 전부 삭제
            await this.managerRepository.deleteManagerWithQueryRunner(queryRunner, updatedTask.id);
        }

        // 7. 최종 managers 조회
        const managers = await this.managerRepository.findManagersByTaskIdWithQueryRunner(
            queryRunner,
            updatedTask.id
        );

        return UpdateTaskResponseDto.from(updatedTask, managers);
    }

    async deleteTask(
        queryRunner: QueryRunner,
        userId: number,
        taskId: number
    ): Promise<DeleteTaskResponseDto> {
        // 1. Task 조회
        const task = await this.taskRepository.findByIdWithQueryRunner(queryRunner, taskId);

        // 2. 프로젝트 참여 여부 확인
        const projectId = task.step.project.id;
        await this.projectsService.checkProjectMember(userId, projectId);

        // 3. TaskFile 조회
        const taskFiles = await this.taskFileRepository.findTaskFilesByIdWithQueryRunner(
            queryRunner,
            taskId
        );

        // 4. 파일 삭제 (S3 + DB)
        for (const file of taskFiles) {
            try {
                const key = file.fileUrl.split('.amazonaws.com/')[1];
                if (key) {
                    await this.uploadService.deleteFile(key); // S3 파일 삭제
                }
                await this.taskFileRepository.deleteTaskFileWithQueryRunner(queryRunner, file.id); // DB 삭제
            } catch (err) {
                console.error(`[파일 삭제 실패] ${file.fileUrl}`);
                console.error(err);
            }
        }

        // 5. Task 삭제
        await this.taskRepository.deleteWithQueryRunner(queryRunner, task.id);

        return {
            message: '업무가 성공적으로 삭제되었습니다.',
            taskId,
        };
    }

    async getTask(userId: number, taskId: number): Promise<GetTaskResponseDto> {
        const task = await this.taskRepository.findById(taskId);

        if (!task) {
            throw new TaskNotFoundException();
        }

        // 프로젝트 참여 여부 검증
        const projectId = task.step.project.id;

        await this.projectsService.checkProjectMember(userId, projectId);

        // Manager[] 형태 가공
        const managers = task.managers;

        return GetTaskResponseDto.from(task, managers);
    }

    async getTaskDashBoard(
        userId: number,
        projectId: number,
        view: string
    ): Promise<TaskDashboardStepViewDto | TaskDashboardStatusViewDto> {
        if (view !== 'step' && view !== 'status') {
            throw new BadRequestException(`'view' 파라미터는 'step' 또는 'status'만 허용됩니다.`);
        }

        // 1. 프로젝트 존재 검증
        const project = await this.projectsService.assertProjectExists(projectId);

        // 2. 프로젝트 참여 여부 검증
        await this.projectsService.checkProjectMember(userId, projectId);

        // 전체 업무 수 (더보기 버튼 표시 여부 판단)
        const totalCount = await this.taskRepository.countByProjectId(projectId);

        // 2. status / step 분기 처리
        if (view === 'status') {
            const statuses = [Status.NOTSTART, Status.ONGOING, Status.COMPLETED];
            const statusGroups: { status: Status; tasks: TaskInStatusDto[] }[] = [];

            for (const status of statuses) {
                const tasks =
                    await this.taskRepository.findTop5ByProjectIdAndStatusOrderByDeadlineAsc(
                        projectId,
                        status
                    );

                statusGroups.push({
                    status,
                    tasks: tasks.map((task) => TaskInStatusDto.from(task)),
                });
            }

            return {
                projectId: project.id,
                projectName: project.name,
                statusGroups,
                totalCount,
            };
        } else {
            const steps = await this.stepRepository.findByProjectId(projectId);

            const stepGroups: { stepId: number; stepName: string; tasks: TaskInStepDto[] }[] = [];

            for (const step of steps) {
                const tasks =
                    await this.taskRepository.findTop5ByProjectIdAndStepOrderByDeadlineAsc(
                        projectId,
                        step.id
                    );

                stepGroups.push({
                    stepId: step.id,
                    stepName: step.name,
                    tasks: tasks.map((task) => TaskInStepDto.from(task)),
                });
            }

            return {
                projectId: project.id,
                projectName: project.name,
                steps: stepGroups,
                totalCount,
            };
        }
    }

    async createComment(
        queryRunner: QueryRunner,
        userId: number,
        taskId: number,
        createCommentRequestDto: CreateCommentRequestDto
    ): Promise<CreateCommentResponseDto> {
        // 1. 업무 존재 여부 및 프로젝트 가져오기
        const task = await this.taskRepository.findById(taskId);

        // 2. 프로젝트 참여자 여부 확인
        const projectId = task.step.project.id;
        await this.projectsService.checkProjectMember(userId, projectId);

        // 3. 댓글 생성 및 저장
        const comment = queryRunner.manager.create(CommentEntity, {
            user: { id: userId },
            task: { id: taskId },
            content: createCommentRequestDto.content,
        });
        const saved = await this.commentRepository.saveCommentWithQueryRunner(queryRunner, comment);
        // 4. 응답 반환
        return CreateCommentResponseDto.from(saved);
    }

    async createTaskFile(
        queryRunner: QueryRunner,
        userId: number,
        taskId: number,
        file: Express.Multer.File
    ): Promise<CreateTaskFileResponseDto> {
        // 1. Task 조회 (Step, Project 조인)
        const task = await this.taskRepository.findByIdWithQueryRunner(queryRunner, taskId);
        // 2. 프로젝트 참여자 여부 확인
        await this.projectsService.checkProjectMember(userId, task.step.project.id);

        const fileUrl = await this.uploadService.uploadFile(file);

        // 4. TaskFile 생성
        const taskFile = queryRunner.manager.create(TaskFile);
        Object.assign(taskFile, {
            fileUrl,
            task: { id: taskId },
            user: { id: userId },
        });

        // 5. DB 저장
        const saved = await this.taskFileRepository.saveTaskFileWithQueryRunner(
            queryRunner,
            taskFile
        );
        // 6. DTO 변환 후 반환
        return CreateTaskFileResponseDto.fromEntity(saved);
    }

    // STEP별 더보기 API
    async getMoreTasksByStep(
        projectId: number,
        stepId: number,
        offset: number,
        limit: number = 5
    ): Promise<{ tasks: TaskInStepDto[]; totalCount: number }> {
        await this.stepRepository.findById(stepId);
        if (offset < 0) throw new BadRequestException('offset은 0 이상이어야 합니다.');
        if (limit < 1 || limit > 50) throw new BadRequestException('limit은 1~50 사이여야 합니다.');

        const tasks = await this.taskRepository.findByProjectAndStepPaginated(
            projectId,
            stepId,
            limit,
            offset
        );
        const totalCount = tasks.totalCount;

        return { tasks: tasks.items.map((t) => TaskInStepDto.from(t)), totalCount };
    }

    // STATUS별 더보기 API
    async getMoreTasksByStatus(
        projectId: number,
        status: Status,
        offset: number,
        limit: number = 5
    ): Promise<{ tasks: TaskInStatusDto[]; totalCount: number }> {
        if (!Object.values(Status).includes(status)) {
            throw new BadRequestException(
                `status는 ${Object.values(Status).join(', ')} 중 하나여야 합니다.`
            );
        }

        if (offset < 0) throw new BadRequestException('offset은 0 이상이어야 합니다.');
        if (limit < 1 || limit > 50) throw new BadRequestException('limit은 1~50 사이여야 합니다.');

        const tasks = await this.taskRepository.findByProjectAndStatusPaginated(
            projectId,
            status,
            limit,
            offset
        );
        const totalCount = tasks.totalCount;

        return { tasks: tasks.items.map((t) => TaskInStatusDto.from(t)), totalCount };
    }

    //업무별 댓글 조회
    async getComment(taskId: number, offset: number): Promise<GetCommentResponseDto> {
        await this.taskRepository.findById(taskId);

        if (offset < 0) {
            throw new BadRequestException('offset은 0 이상이어야 합니다.');
        }

        const limit = 10;

        // 댓글 조회 (댓글 작성자 + 대댓글 + 대댓글 작성자까지 한번에 조인)
        const comments = await this.commentRepository.findByTaskIdWithCocommentsPaginated(
            taskId,
            limit,
            offset
        );

        // 댓글 총 개수 (hasMore 계산용)
        const totalCount = await this.commentRepository.countByTaskId(taskId);

        // DTO 변환
        return GetCommentResponseDto.from(comments, totalCount, offset, limit);
    }

    // 사용자 별 업무 조회
    async getTaskByUser(
        userId: number,
        cursor?: string
    ): Promise<PaginatedResponseDto<ProjectDashBoardDTO>> {
        const maxProjectNum: number = Number(this.configService.get('MAX_PROJECT_PAGE')) || 4;
        //1. 사용자가 참여한 프로젝트 조회
        const projects = await this.usersService.getProjectsByUser(userId);

        //2. 커서값 및 maxProjectNum에 따라 projects 파싱
        let startIndex: number = 0;
        if (cursor) {
            startIndex = projects.findIndex((project) => project.createdAt > new Date(cursor));
            if (startIndex === -1) startIndex = projects.length;
        }
        let lastIndex: number = projects.length;
        let nextCursor: string | null = null;
        let hasNextPage: boolean = false;
        if (startIndex + maxProjectNum + 1 <= projects.length) {
            lastIndex = startIndex + maxProjectNum;
            nextCursor = projects[lastIndex - 1].createdAt.toISOString();
            hasNextPage = true;
        }
        const pagedProjects = projects.slice(startIndex, lastIndex);

        //3. 프로젝트 별 업무 조회
        const results = await Promise.all(
            pagedProjects.map(async (p) => {
                return ProjectDashBoardDTO.from({
                    id: p.project.id,
                    name: p.project.name,
                    tasks: await this.getTaskByProject(userId, p.project.id),
                });
            })
        );
        return PaginatedResponseDto.of(results, nextCursor, hasNextPage);
    }

    // 프로젝트 별 나의 업무 조회
    async getTaskByProject(
        userId: number,
        projectId: number,
        cursor?: any
    ): Promise<TaskCardDTO[]> {
        const maxCardNum: number = Number(this.configService.get('MAX_TASK_PAGE')) || 5;
        const tasks = await this.taskRepository.findUserAssignedOngoingTasksForDashboard(
            projectId,
            userId,
            maxCardNum
        );
        return tasks.map((task) => TaskCardDTO.from(task));
    }

    async getSearchTask(
        userId: number,
        projectId: number,
        view: string,
        dto: GetSearchTaskDto
    ): Promise<TaskDashboardStepViewDto | TaskDashboardStatusViewDto> {
        if (view !== 'step' && view !== 'status') {
            throw new BadRequestException(`'view' 파라미터는 'step' 또는 'status'만 허용됩니다.`);
        }

        // ───  프로젝트 + 참여자 검증 ─────────────────────
        const project = await this.projectsService.assertProjectExists(projectId);

        await this.projectsService.checkProjectMember(userId, projectId);

        //2) 필터용 baseQb
        const baseQb = this.buildSearchBaseQb(projectId, dto);

        // 3) 전체 개수
        const totalCount = await baseQb.getCount();

        // 4) 그룹별 5개씩 병렬 조회
        if (view === 'status') {
            const statuses = [Status.NOTSTART, Status.ONGOING, Status.COMPLETED];
            const statusGroups = await Promise.all(
                statuses.map(async (status) => {
                    const tasks = await baseQb
                        .clone() // 이미 모든 조인이 들어있음
                        .andWhere('task.status = :status', { status })
                        .orderBy('task.deadline', 'ASC')
                        .addOrderBy('task.createdAt', 'ASC')
                        .limit(5)
                        .getMany();

                    return {
                        status,
                        tasks: tasks.map(TaskInStatusDto.from),
                    };
                })
            );

            return { projectId, projectName: project.name, statusGroups, totalCount };
        } else {
            const steps = await this.stepRepository.findByProjectId(projectId);

            const stepGroups = await Promise.all(
                steps.map(async (step) => {
                    const tasks = await baseQb
                        .clone()
                        .andWhere('task.stepId = :stepId', { stepId: step.id })
                        .orderBy('task.deadline', 'ASC')
                        .addOrderBy('task.createdAt', 'ASC')
                        .limit(5)
                        .getMany();

                    return {
                        stepId: step.id,
                        stepName: step.name,
                        tasks: tasks.map(TaskInStepDto.from),
                    };
                })
            );

            return { projectId, projectName: project.name, steps: stepGroups, totalCount };
        }
    }
    async getSearchMoreTasksByStep(
        userId: number,
        projectId: number,
        stepId: number,
        offset: number,
        limit: number,
        dto: GetSearchTaskDto
    ): Promise<{ tasks: TaskInStepDto[]; totalCount: number }> {
        // 프로젝트/멤버 검증은 기존 getSearchTask와 동일
        // 1. 프로젝트 존재 검증
        await this.projectsService.assertProjectExists(projectId);

        // 2. 프로젝트 참여 여부 검증
        await this.projectsService.checkProjectMember(userId, projectId);

        if (offset < 0) throw new BadRequestException('offset은 0 이상이어야 합니다.');
        if (limit < 1 || limit > 50) throw new BadRequestException('limit은 1~50 사이여야 합니다.');

        const baseQb = this.buildSearchBaseQb(projectId, dto);

        const tasks = await baseQb
            .clone()
            .andWhere('task.stepId = :stepId', { stepId })
            .orderBy('task.deadline', 'ASC')
            .addOrderBy('task.createdAt', 'ASC')
            .skip(offset)
            .take(limit)
            .getMany();

        const totalCount = await baseQb
            .clone()
            .andWhere('task.stepId = :stepId', { stepId })
            .getCount();

        return { tasks: tasks.map(TaskInStepDto.from), totalCount };
    }

    async getSearchMoreTasksByStatus(
        userId: number,
        projectId: number,
        status: Status,
        offset: number,
        limit: number,
        dto: GetSearchTaskDto
    ): Promise<{ tasks: TaskInStatusDto[]; totalCount: number }> {
        if (!Object.values(Status).includes(status)) {
            throw new BadRequestException(
                `status는 ${Object.values(Status).join(', ')} 중 하나여야 합니다.`
            );
        }

        // 1. 프로젝트 존재 검증
        await this.projectsService.assertProjectExists(projectId);

        // 2. 프로젝트 참여 여부 검증
        await this.projectsService.checkProjectMember(userId, projectId);

        if (offset < 0) throw new BadRequestException('offset은 0 이상이어야 합니다.');
        if (limit < 1 || limit > 50) throw new BadRequestException('limit은 1~50 사이여야 합니다.');

        const baseQb = this.buildSearchBaseQb(projectId, dto);

        const tasks = await baseQb
            .clone()
            .andWhere('task.status = :status', { status })
            .orderBy('task.deadline', 'ASC')
            .addOrderBy('task.createdAt', 'ASC')
            .skip(offset)
            .take(limit)
            .getMany();

        const totalCount = await baseQb
            .clone()
            .andWhere('task.status = :status', { status })
            .getCount();

        return { tasks: tasks.map(TaskInStatusDto.from), totalCount };
    }

    //BaseQb  + dto 기반 필터 헬퍼 함수 (검색에서 필터링하는 함수)
    private buildSearchBaseQb(projectId: number, dto: GetSearchTaskDto) {
        const qb = this.taskRepository.getProjectTasksBaseQb(projectId);

        if (dto.statuses?.length) {
            qb.andWhere('task.status IN (:...statuses)', { statuses: dto.statuses });
        }
        if (dto.managerIds?.length) {
            qb.andWhere('user.id IN (:...managerIds)', { managerIds: dto.managerIds });
        }
        if (dto.dateBefore || dto.dateAfter) {
            qb.andWhere(
                new Brackets((q) => {
                    if (dto.dateBefore) {
                        q.where('task.deadline <= :dateBefore', {
                            dateBefore: `${dto.dateBefore} 23:59:59`,
                        });
                    }
                    if (dto.dateAfter) {
                        q.orWhere('task.deadline >= :dateAfter', {
                            dateAfter: `${dto.dateAfter} 00:00:00`,
                        });
                    }
                })
            );
        }
        return qb;
    }
}
