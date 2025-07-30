import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './tasks.entity';
import { Step } from '../steps/entities/steps.entity';
import { UserProject } from '../mappings/user-projects/userProjects.entity';
import { CreateTaskRequestDto } from './dtos/create-task.dto';
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
import {
    GetCommentResponseDto,
    UserInCommentDto,
    CocommentInCommentDto,
} from '../comments/dto/get-comment.dto';
import { Status } from '../../common/enums/status.enum';
import {
    ProjectForbiddenException,
    StepNotFoundException,
    TaskNotFoundException,
    ProjectNotFoundException,
    BadRequestException,
} from 'src/common/exceptions/custom.errors';

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
        userId: number,
        createTaskRequestDto: CreateTaskRequestDto
    ): Promise<{ taskId: number }> {
        const { stepId } = createTaskRequestDto;

        const targetStep = await this.stepRepository.findOne({
            where: { id: stepId },
            relations: ['project'],
        });

        if (!targetStep) {
            throw new StepNotFoundException();
        }

        const projectId = targetStep.project.id;

        const userPorject = await this.userProjectRepository.findOne({
            where: {
                user: { id: userId },
                project: { id: projectId },
            },
        });

        if (!userPorject) {
            throw new ProjectForbiddenException();
        }

        const task = {
            step: targetStep,
            name: '빈 업무',
            memo: ' ',
            deadline: new Date(),
        };
        const saved = await this.taskRepository.save(task);
        return { taskId: saved.id };
    }

    async updateTask(dto: UpdateTaskRequestDto, userId: number, taskId: number) {
        const task = await this.taskRepository.findOne({
            where: { id: taskId },
            relations: ['step', 'step.project'],
        });

        if (!task) throw new TaskNotFoundException();

        // step 무조건 덮어쓰기
        const newStep = await this.stepRepository.findOne({
            where: { id: dto.stepId },
            relations: ['project'],
        });

        if (!newStep) throw new StepNotFoundException();

        const userProject = await this.userProjectRepository.findOne({
            where: {
                user: { id: userId },
                project: { id: newStep.project.id },
            },
        });

        if (!userProject) throw new ProjectForbiddenException();

        task.step = newStep;
        task.name = dto.name;
        task.deadline = new Date(dto.deadline);
        task.status = dto.status;
        task.memo = dto.memo;

        const updatedTask = await this.taskRepository.save(task);

        // managerIds 무조건 덮어쓰기
        await this.managerRepository.delete({ task: { id: updatedTask.id } });

        for (const managerId of dto.managerIds) {
            const manager = this.managerRepository.create({
                user: { id: managerId },
                task: updatedTask,
            });
            await this.managerRepository.save(manager);
        }

        const managers = await this.managerRepository.find({
            where: { task: { id: updatedTask.id } },
            relations: ['user'],
        });

        return UpdateTaskResponseDto.from(updatedTask, managers);
    }
    async deleteTask(userId: number, taskId: number): Promise<DeleteTaskResponseDto> {
        const task = await this.taskRepository.findOne({
            where: { id: taskId },
            relations: ['step', 'step.project'],
        });

        if (!task) {
            throw new TaskNotFoundException();
        }

        // 프로젝트 참여 여부 확인
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

        // 관련 TaskFile 가져오기
        const taskFiles = await this.taskFileRepository.find({
            where: { task: { id: taskId } },
        });

        // S3 및 DB에서 파일 삭제
        for (const file of taskFiles) {
            try {
                const key = file.fileUrl.split('.amazonaws.com/')[1];
                if (key) {
                    await this.uploadService.deleteFile(key); // S3 삭제
                }
                await this.taskFileRepository.delete({ id: file.id }); // DB 삭제
            } catch (err) {
                console.error(`[파일 삭제 실패] ${file.fileUrl}`);
                console.error(err);
                // 실패하더라도 전체 삭제는 계속 진행
            }
        }

        // 업무 삭제
        await this.taskRepository.delete(taskId);

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

        // 2. 프로젝트 전체 업무 조회 (step 포함)
        const tasks = await this.taskRepository
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.step', 'step')
            .leftJoin('task.managers', 'manager')
            .leftJoin('manager.user', 'user')
            .addSelect(['user.id', 'user.name'])
            .where('step.projectId = :projectId', { projectId })
            .orderBy('task.deadline', 'ASC')
            .addOrderBy('task.createdAt', 'ASC')
            .limit(40)
            .getMany();

        // 전체 업무 수 (더보기 버튼 표시 여부 판단)
        const totalCount = await this.taskRepository
            .createQueryBuilder('task')
            .leftJoin('task.step', 'step')
            .where('step.projectId = :projectId', { projectId })
            .getCount();

        // 3. view 값에 따라 응답 구조 조립
        if (view === 'status') {
            const statusGroups = this.groupByStatus(tasks);
            return {
                projectId: project.id,
                projectName: project.name,
                statusGroups,
                totalCount,
            };
        } else {
            const stepGroups = this.groupByStep(tasks);
            return {
                projectId: project.id,
                projectName: project.name,
                steps: stepGroups,
                totalCount,
            };
        }
    }

    private groupByStep(tasks: Task[]): StepGroupDto[] {
        const map = new Map<number, StepGroupDto>();

        for (const task of tasks) {
            const stepId = task.step.id;
            if (!map.has(stepId)) {
                map.set(stepId, {
                    stepId,
                    stepName: task.step.name,
                    tasks: [],
                });
            }

            const taskDto = TaskInStepDto.from(task);
            map.get(stepId)!.tasks.push(taskDto);
        }
        return [...map.values()];
    }

    private groupByStatus(tasks: Task[]): StatusGroupDto[] {
        const map = new Map<Status, StatusGroupDto>();

        for (const task of tasks) {
            const status = task.status;
            if (!map.has(status)) {
                map.set(status, {
                    status,
                    tasks: [],
                });
            }

            const taskDto = TaskInStatusDto.from(task);
            map.get(status)!.tasks.push(taskDto);
        }

        return [...map.values()];
    }

    async createComment(
        userId: number,
        taskId: number,
        createCommentRequestDto: CreateCommentRequestDto
    ): Promise<CreateCommentResponseDto> {
        // 1. 업무 존재 여부 및 프로젝트 가져오기
        const task = await this.taskRepository
            .createQueryBuilder('task')
            .leftJoin('task.step', 'step')
            .leftJoin('step.project', 'project')
            .where('task.id = :taskId', { taskId })
            .select(['step.id AS stepId', 'project.id AS projectId'])
            .getRawOne();

        if (!task) throw new TaskNotFoundException();

        // 2. 프로젝트 참여자 여부 확인
        const { projectId } = task;
        const isMember = await this.userProjectRepository.findOne({
            where: {
                user: { id: userId },
                project: { id: projectId },
            },
        });
        if (!isMember) throw new ProjectForbiddenException();

        // 3. 댓글 생성 및 저장
        const comment = this.commentRepository.create({
            user: { id: userId },
            task: { id: taskId },
            content: createCommentRequestDto.content,
        });
        const saved = await this.commentRepository.save(comment);

        // 4. 응답 반환
        return CreateCommentResponseDto.from(saved);
    }

    async createTaskFile(
        userId: number,
        taskId: number,
        file: Express.Multer.File
    ): Promise<CreateTaskFileResponseDto> {
        const task = await this.taskRepository
            .createQueryBuilder('task')
            .leftJoin('task.step', 'step')
            .leftJoin('step.project', 'project')
            .select(['task.id', 'step.id', 'project.id AS project_id'])
            .where('task.id = :taskId', { taskId })
            .getRawOne();
        if (!task) throw new TaskNotFoundException();

        const userProject = await this.userProjectRepository.findOne({
            where: {
                user: { id: userId },
                project: { id: task.project_id },
            },
        });
        if (!userProject) throw new ProjectForbiddenException();

        const key = await this.uploadService.uploadFile(file);
        const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        const taskFile = this.taskFileRepository.create({
            fileUrl,
            task,
            user: { id: userId },
        });

        const saved = await this.taskFileRepository.save(taskFile);
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
