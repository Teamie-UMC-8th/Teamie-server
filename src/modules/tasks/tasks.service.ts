import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from './tasks.entity';
import { Step } from '../steps/entities/steps.entity';
import { UserProject } from '../mappings/user-projects/userProjects.entity';
import { User } from '../users/entities/users.entity';
import { CreateTaskRequestDto, CreateTaskResponseDto } from './dtos/create-task.dto';
import {
    CreateCommentResponseDto,
    CreateCommentRequestDto,
} from '../comments/dto/create-comment.dto';
import { UpdateTaskRequestDto, UpdateTaskResponseDto } from './dtos/update-task.dto';
import { Manager } from '../mappings/managers/managers.entity';
import { Project } from '../projects/entities/projects.entity';
import { DeleteTaskResponseDto } from './dtos/delete-task.dto';
import { TaskFile } from '../mappings/task-files/task-files.entity';
import { Comment as CommentEntity } from '../comments/comments.entity';
import { GetTaskResponseDto } from './dtos/get-task.dto';
import { UploadService } from '../../infra/upload/upload.service';
import { TaskDashboardStepViewDto } from './dtos/task-dashboard-step-view-dto';
import { TaskDashboardStatusViewDto } from './dtos/task-dashboard-status-view-dto';
import { StepGroupDto, TaskInStepDto } from './dtos/task-dashboard-step-view-dto';
import { StatusGroupDto, TaskInStatusDto } from './dtos/task-dashboard-status-view-dto';
import { CreateTaskFileResponseDto } from '../mappings/task-files/dtos/create-task-files.dto';
import { GetCommentResponseDto } from '../comments/dto/get-comment.dto';
import { Status } from '../../common/enums/status.enum';
import {
    ProjectForbiddenException,
    StepNotFoundException,
    TaskNotFoundException,
    ProjectNotFoundException,
    BadRequestException,
} from 'src/common/exceptions/custom.errors';
import { QueryRunner } from 'typeorm';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,

        @InjectRepository(Step)
        private readonly stepRepository: Repository<Step>,

        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,

        @InjectRepository(UserProject)
        private readonly userProjectRepository: Repository<UserProject>,

        @InjectRepository(Manager)
        private readonly managerRepository: Repository<Manager>,

        private readonly uploadService: UploadService,

        @InjectRepository(TaskFile)
        private readonly taskFileRepository: Repository<TaskFile>,

        @InjectRepository(CommentEntity)
        private readonly commentRepository: Repository<CommentEntity>
    ) {}

    async createTask(
        queryRunner: QueryRunner,
        userId: number,
        createTaskRequestDto: CreateTaskRequestDto
    ): Promise<CreateTaskResponseDto> {
        const { stepId } = createTaskRequestDto;

        // Step 조회
        const targetStep = await queryRunner.manager.findOne(Step, {
            where: { id: stepId },
            relations: ['project'],
        });

        if (!targetStep) {
            throw new StepNotFoundException();
        }

        const projectId = targetStep.project.id;

        // userProject 조회
        const userProject = await queryRunner.manager.findOne(UserProject, {
            where: {
                user: { id: userId },
                project: { id: projectId },
            },
        });

        if (!userProject) {
            throw new ProjectForbiddenException();
        }

        // 업무 생성
        const task = queryRunner.manager.create(Task, {
            step: targetStep,
            name: '빈 업무',
            memo: null,
            deadline: null,
        });

        const saved = await queryRunner.manager.save(task);

        return CreateTaskResponseDto.fromEntity(saved);
    }

    async updateTask(
        queryRunner: QueryRunner,
        userId: number,
        taskId: number,
        dto: UpdateTaskRequestDto
    ): Promise<UpdateTaskResponseDto> {
        // 1. 수정할 Task 조회
        const task = await queryRunner.manager.findOne(Task, {
            where: { id: taskId },
            relations: ['step', 'step.project'],
        });

        if (!task) throw new TaskNotFoundException();

        // 2. 새 Step 조회
        const newStep = await queryRunner.manager.findOne(Step, {
            where: { id: dto.stepId },
            relations: ['project'],
        });

        if (!newStep) throw new StepNotFoundException();

        // 3. userProject 조회 (업데이트할 유저가 프로젝트에 속해있는지)
        const userProject = await queryRunner.manager.findOne(UserProject, {
            where: {
                user: { id: userId },
                project: { id: newStep.project.id },
            },
        });

        if (!userProject) throw new ProjectForbiddenException();

        // 4. Task 필드 덮어쓰기
        task.step = newStep;
        task.name = dto.name;
        task.deadline = dto.deadline;
        task.status = dto.status;
        task.memo = dto.memo;

        const updatedTask = await queryRunner.manager.save(Task, task);

        // 5. managerIds 유효성 검사 추가
        if (dto.managerIds && dto.managerIds.length > 0) {
            const participants = await queryRunner.manager.find(UserProject, {
                where: {
                    user: { id: In(dto.managerIds) },
                    project: { id: newStep.project.id },
                },
                relations: ['user'],
                select: {
                    id: true,
                    user: { id: true, name: true },
                },
            });

            const validManagerIds = participants.map((up) => up.user.id);
            const invalidManagers: string[] = [];

            for (const managerId of dto.managerIds) {
                if (!validManagerIds.includes(managerId)) {
                    const user = await queryRunner.manager.findOne(User, {
                        where: { id: managerId },
                        select: ['id', 'name'],
                    });
                    invalidManagers.push(user?.name ?? `userId ${managerId}`);
                }
            }

            if (invalidManagers.length > 0) {
                throw new ProjectForbiddenException(
                    `${invalidManagers.join(', ')} 은/는 프로젝트 참여자가 아닙니다.`
                );
            }

            // 6. 기존 Manager 전부 삭제 후 유효한 Manager만 저장
            await queryRunner.manager.delete(Manager, { task: { id: updatedTask.id } });

            for (const managerId of validManagerIds) {
                const manager = queryRunner.manager.create(Manager, {
                    user: { id: managerId },
                    task: updatedTask,
                });
                await queryRunner.manager.save(Manager, manager);
            }
        } else {
            // managerIds가 없으면 기존 Manager만 삭제
            await queryRunner.manager.delete(Manager, { task: { id: updatedTask.id } });
        }

        // 7. 최종 managers 조회
        const managers = await queryRunner.manager.find(Manager, {
            where: { task: { id: updatedTask.id } },
            relations: ['user'],
            select: {
                id: true,
                user: { id: true, name: true },
            },
        });

        return UpdateTaskResponseDto.from(updatedTask, managers);
    }

    async deleteTask(
        queryRunner: QueryRunner,
        userId: number,
        taskId: number
    ): Promise<DeleteTaskResponseDto> {
        // 1. Task 조회
        const task = await queryRunner.manager.findOne(Task, {
            where: { id: taskId },
            relations: ['step', 'step.project'],
        });

        if (!task) {
            throw new TaskNotFoundException();
        }

        // 2. 프로젝트 참여 여부 확인
        const projectId = task.step.project.id;
        const userProject = await queryRunner.manager.findOne(UserProject, {
            where: {
                user: { id: userId },
                project: { id: projectId },
            },
        });

        if (!userProject) {
            throw new ProjectForbiddenException();
        }

        // 3. TaskFile 조회
        const taskFiles = await queryRunner.manager.find(TaskFile, {
            where: { task: { id: taskId } },
        });

        // 4. 파일 삭제 (S3 + DB)
        for (const file of taskFiles) {
            try {
                const key = file.fileUrl.split('.amazonaws.com/')[1];
                if (key) {
                    await this.uploadService.deleteFile(key); // S3 파일 삭제
                }
                await queryRunner.manager.delete(TaskFile, { id: file.id }); // DB 삭제
            } catch (err) {
                console.error(`[파일 삭제 실패] ${file.fileUrl}`);
                console.error(err);
            }
        }

        // 5. Task 삭제
        await queryRunner.manager.delete(Task, taskId);

        return {
            message: '업무가 성공적으로 삭제되었습니다.',
            taskId,
        };
    }

    async getTask(userId: number, taskId: number): Promise<GetTaskResponseDto> {
        const task = await this.taskRepository.findOne({
            where: { id: taskId },
            relations: ['step', 'step.project', 'taskFiles', 'managers', 'managers.user'],
        });

        if (!task) {
            throw new TaskNotFoundException();
        }

        // 프로젝트 참여 여부 검증
        const projectId = task.step.project.id;
        const userProject = await this.userProjectRepository.findOne({
            where: {
                user: { id: userId },
                project: { id: projectId },
            },
        });

        if (!userProject) {
            throw new ProjectForbiddenException();
        }

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

        // 1. 프로젝트 존재 및 참여자 검증
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            relations: ['userProjects'],
        });
        if (!project) throw new ProjectNotFoundException();

        const isMember = await this.userProjectRepository.findOne({
            where: { user: { id: userId }, project: { id: projectId } },
        });
        if (!isMember) throw new ProjectForbiddenException();

        // 전체 업무 수 (더보기 버튼 표시 여부 판단)
        const totalCount = await this.taskRepository
            .createQueryBuilder('task')
            .leftJoin('task.step', 'step')
            .where('step.projectId = :projectId', { projectId })
            .getCount();

        // 2. status / step 분기 처리
        if (view === 'status') {
            const statuses = [Status.NOTSTART, Status.ONGOING, Status.COMPLETED];
            const statusGroups: { status: Status; tasks: TaskInStatusDto[] }[] = [];

            for (const status of statuses) {
                const tasks = await this.taskRepository
                    .createQueryBuilder('task')
                    .leftJoinAndSelect('task.step', 'step')
                    .leftJoin('task.managers', 'manager')
                    .leftJoin('manager.user', 'user')
                    .addSelect(['user.id', 'user.name'])
                    .where('step.projectId = :projectId', { projectId })
                    .andWhere('task.status = :status', { status })
                    .orderBy('task.deadline', 'ASC')
                    .addOrderBy('task.createdAt', 'ASC')
                    .limit(5)
                    .getMany();

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
            const steps = await this.stepRepository.find({
                where: { project: { id: projectId } },
                order: { createdAt: 'ASC' },
            });

            const stepGroups: { stepId: number; stepName: string; tasks: TaskInStepDto[] }[] = [];

            for (const step of steps) {
                const tasks = await this.taskRepository
                    .createQueryBuilder('task')
                    .leftJoinAndSelect('task.step', 'step')
                    .leftJoin('task.managers', 'manager')
                    .leftJoin('manager.user', 'user')
                    .addSelect(['user.id', 'user.name'])
                    .where('task.stepId = :stepId', { stepId: step.id })
                    .orderBy('task.deadline', 'ASC')
                    .addOrderBy('task.createdAt', 'ASC')
                    .limit(5)
                    .getMany();

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
        const task = await queryRunner.manager
            .createQueryBuilder(Task, 'task')
            .leftJoin('task.step', 'step')
            .leftJoin('step.project', 'project')
            .where('task.id = :taskId', { taskId })
            .select(['step.id AS stepId', 'project.id AS projectId'])
            .getRawOne();

        if (!task) throw new TaskNotFoundException();

        // 2. 프로젝트 참여자 여부 확인
        const { projectId } = task;
        const isMember = await queryRunner.manager.findOne(UserProject, {
            where: {
                user: { id: userId },
                project: { id: projectId },
            },
        });
        if (!isMember) throw new ProjectForbiddenException();

        // 3. 댓글 생성 및 저장
        const comment = queryRunner.manager.create(CommentEntity, {
            user: { id: userId },
            task: { id: taskId },
            content: createCommentRequestDto.content,
        });
        const saved = await queryRunner.manager.save(CommentEntity, comment);

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
        const task = await queryRunner.manager
            .createQueryBuilder(Task, 'task')
            .leftJoin('task.step', 'step')
            .leftJoin('step.project', 'project')
            .select(['task.id', 'step.id', 'project.id AS project_id'])
            .where('task.id = :taskId', { taskId })
            .getRawOne();

        if (!task) throw new TaskNotFoundException();

        // 2. 프로젝트 참여자 여부 확인
        const userProject = await queryRunner.manager.findOne(UserProject, {
            where: {
                user: { id: userId },
                project: { id: task.project_id },
            },
        });

        if (!userProject) throw new ProjectForbiddenException();

        const fileUrl = await this.uploadService.uploadFile(file);

        // 4. TaskFile 생성
        const taskFile = queryRunner.manager.create(TaskFile);
        Object.assign(taskFile, {
            fileUrl,
            task: { id: taskId },
            user: { id: userId },
        });

        // 5. DB 저장
        const saved = await queryRunner.manager.save(TaskFile, taskFile);

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
        const step = await this.stepRepository.findOne({
            where: { id: stepId, project: { id: projectId } },
        });
        if (!step) throw new StepNotFoundException('존재하지 않는 Step입니다.');

        if (offset < 0) throw new BadRequestException('offset은 0 이상이어야 합니다.');
        if (limit < 1 || limit > 50) throw new BadRequestException('limit은 1~50 사이여야 합니다.');

        const tasks = await this.taskRepository
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.step', 'step')
            .leftJoin('task.managers', 'manager')
            .leftJoin('manager.user', 'user')
            .addSelect(['user.id', 'user.name'])
            .where('step.projectId = :projectId', { projectId })
            .andWhere('step.id = :stepId', { stepId })
            .orderBy('task.deadline', 'ASC')
            .addOrderBy('task.createdAt', 'ASC')
            .skip(offset) // 이전까지 불러온 개수
            .take(limit) // 새로 불러올 개수
            .getMany();

        const totalCount = await this.taskRepository
            .createQueryBuilder('task')
            .leftJoin('task.step', 'step')
            .where('step.projectId = :projectId', { projectId })
            .andWhere('step.id = :stepId', { stepId })
            .getCount();

        return { tasks: tasks.map((t) => TaskInStepDto.from(t)), totalCount };
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

        const tasks = await this.taskRepository
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.step', 'step')
            .leftJoin('task.managers', 'manager')
            .leftJoin('manager.user', 'user')
            .addSelect(['user.id', 'user.name'])
            .where('step.projectId = :projectId', { projectId })
            .andWhere('task.status = :status', { status })
            .orderBy('task.deadline', 'ASC')
            .addOrderBy('task.createdAt', 'ASC')
            .skip(offset)
            .take(limit)
            .getMany();

        const totalCount = await this.taskRepository
            .createQueryBuilder('task')
            .leftJoin('task.step', 'step')
            .where('step.projectId = :projectId', { projectId })
            .andWhere('task.status = :status', { status })
            .getCount();

        return { tasks: tasks.map((t) => TaskInStatusDto.from(t)), totalCount };
    }

    //업무별 댓글 조회
    async getComment(taskId: number, offset: number): Promise<GetCommentResponseDto> {
        const task = await this.taskRepository.findOne({
            where: { id: taskId },
        });

        if (!task) {
            throw new TaskNotFoundException();
        }

        if (offset < 0) {
            throw new BadRequestException('offset은 0 이상이어야 합니다.');
        }

        const limit = 10;

        // 댓글 조회 (댓글 작성자 + 대댓글 + 대댓글 작성자까지 한번에 조인)
        const comments = await this.commentRepository
            .createQueryBuilder('comment')
            .leftJoinAndSelect('comment.user', 'user') // 댓글 작성자
            .leftJoinAndSelect('comment.cocomments', 'cocomment') // 대댓글
            .leftJoinAndSelect('cocomment.user', 'cocommentUser') // 대댓글 작성자
            .where('comment.taskId = :taskId', { taskId })
            .orderBy('comment.createdAt', 'DESC')
            .addOrderBy('cocomment.createdAt', 'DESC')
            .skip(offset)
            .take(limit)
            .select([
                'comment.id',
                'comment.content',
                'comment.createdAt',
                'comment.updatedAt',
                'user.id',
                'user.name',
                'user.imageUrl',
                'cocomment.id',
                'cocomment.content',
                'cocomment.createdAt',
                'cocomment.updatedAt',
                'cocommentUser.id',
                'cocommentUser.name',
                'cocommentUser.imageUrl',
            ])
            .getMany();

        // 댓글 총 개수 (hasMore 계산용)
        const totalCount = await this.commentRepository.count({
            where: { task: { id: taskId } },
        });

        // DTO 변환
        return GetCommentResponseDto.from(comments, totalCount, offset, limit);
    }
}
