import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Task } from './tasks.entity';
import { Step } from '../steps/entities/steps.entity';
import { UserProject } from '../mappings/user-projects/userProjects.entity';
import { CreateTaskRequestDto, CreateTaskResponseDto } from './dtos/create-task.dto';
import { UpdateTaskRequestDto, UpdateTaskResponseDto } from './dtos/update-task.dto';
import { Manager } from '../mappings/managers/managers.entity';
import { Project } from '../projects/entities/projects.entity';
import { DeleteTaskResponseDto } from './dtos/delete-task.dto';
import { TaskFile } from '../mappings/task-files/task-files.entity';
import { GetTaskResponseDto } from './dtos/get-task.dto';
import { UploadService } from '../../infra/upload/upload.service';
import { TaskDashboardStepViewDto } from './dtos/task-dashboard-step-view-dto';
import { TaskDashboardStatusViewDto } from './dtos/task-dashboard-status-view-dto';
import { StepGroupDto, TaskInStepDto } from './dtos/task-dashboard-step-view-dto';
import { StatusGroupDto, TaskInStatusDto } from './dtos/task-dashboard-status-view-dto';
import { Status } from '../../common/enums/status.enum';
import {
    ProjectForbiddenException,
    StepNotFoundException,
    TaskNotFoundException,
    ProjectNotFoundException,
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
        private readonly taskFileRepository: Repository<TaskFile>
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
            relations: ['taskFiles', 'step', 'step.project'],
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

        // 기존 taskFiles 조회
        const prevFiles = await this.taskFileRepository.find({
            where: { task: { id: updatedTask.id } },
        });

        // 삭제할 파일 URL 계산
        const keepUrls = dto.existingFileUrls || [];
        const toDelete = prevFiles.filter((file) => !keepUrls.includes(file.fileUrl));

        // 1. DB 및 S3에서 제거
        for (const file of toDelete) {
            try {
                const key = file.fileUrl.split('.amazonaws.com/')[1];
                if (!key) {
                    continue;
                }
                await this.uploadService.deleteFile(key); // S3 삭제
                console.log(`[S3] 삭제 완료: ${key}`);

                await this.taskFileRepository.delete({ id: file.id }); // DB 삭제
            } catch (err) {
                console.error(`[파일 삭제 실패] fileUrl: ${file.fileUrl}`);
                console.error(err);
                continue;
            }
        }

        // 2. 새 파일 업로드 및 DB 저장
        if (dto.files && dto.files.length > 0) {
            for (const file of dto.files) {
                const key = await this.uploadService.uploadFile(file);
                const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

                const taskFile = this.taskFileRepository.create({
                    fileUrl,
                    task: updatedTask,
                    user: { id: userId },
                });

                await this.taskFileRepository.save(taskFile);
            }
        }

        const taskFiles = await this.taskFileRepository.find({
            where: { task: { id: updatedTask.id } },
        });

        const fullTask = await this.taskRepository.findOne({
            where: { id: updatedTask.id },
            relations: ['step', 'step.project'],
        });

        if (!fullTask) throw new TaskNotFoundException();

        fullTask.taskFiles = taskFiles;
        const managers = await this.managerRepository.find({
            where: { task: { id: updatedTask.id } },
            relations: ['user'],
        });

        return UpdateTaskResponseDto.from(fullTask, managers);
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
            .getMany();

        // 3. view 값에 따라 응답 구조 조립
        if (view === 'status') {
            const statusGroups = this.groupByStatus(tasks);
            return {
                projectId: project.id,
                projectName: project.name,
                statusGroups,
            };
        } else {
            const stepGroups = this.groupByStep(tasks);
            return {
                projectId: project.id,
                projectName: project.name,
                steps: stepGroups,
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

            const taskDto: TaskInStepDto = {
                taskId: task.id,
                taskName: task.name,
                status: task.status,
                managers: (task.managers ?? []).map((m) => ({
                    userId: m.user.id,
                    userName: m.user.name,
                })),
            };

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

            const taskDto: TaskInStatusDto = {
                taskId: task.id,
                taskName: task.name,
                stepId: task.step.id,
                stepName: task.step.name,
                managers: (task.managers ?? []).map((m) => ({
                    userId: m.user.id,
                    userName: m.user.name,
                })),
            };

            map.get(status)!.tasks.push(taskDto);
        }

        return [...map.values()];
    }
}
