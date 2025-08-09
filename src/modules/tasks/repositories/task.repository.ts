import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Task } from '../entities/tasks.entity';
import { TaskNotFoundException } from 'src/common/exceptions/custom.errors';
import { QueryRunner } from 'typeorm';
import { Step } from '../../steps/entities/steps.entity';
import { Status } from '../../../common/enums/status.enum';

@Injectable()
export class TaskRepository {
    constructor(
        @InjectRepository(Task)
        private readonly repo: Repository<Task>
    ) {}

    //task 조회
    async findById(taskId: number): Promise<Task> {
        const task = await this.repo.findOne({
            where: { id: taskId },
            relations: ['step', 'step.project', 'taskFiles', 'managers', 'managers.user'],
        });

        if (!task) {
            throw new TaskNotFoundException();
        }

        return task;
    }

    //task 조회 with queryRunner
    async findByIdWithQueryRunner(queryRunner: QueryRunner, taskId: number): Promise<Task> {
        const task = await queryRunner.manager.findOne(Task, {
            where: { id: taskId },
            relations: ['step', 'step.project', 'taskFiles', 'managers', 'managers.user'],
        });
        if (!task) throw new TaskNotFoundException();
        return task;
    }

    //프로젝트 별 task 개수 조회
    async countByProjectId(projectId: number): Promise<number> {
        return this.repo
            .createQueryBuilder('task')
            .leftJoin('task.step', 'step')
            .where('step.projectId = :projectId', { projectId })
            .getCount();
    }

    // 진행 상황별로 업무 5개씩 조회 마감기한 오름차순
    async findTop5ByProjectIdAndStatusOrderByDeadlineAsc(
        projectId: number,
        status: string
    ): Promise<Task[]> {
        return this.repo
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
    }

    // step 별로 업무 5개씩 조회 마감기한 오름차순
    async findTop5ByProjectIdAndStepOrderByDeadlineAsc(
        projectId: number,
        stepId: number
    ): Promise<Task[]> {
        return this.repo
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.step', 'step')
            .leftJoin('task.managers', 'manager')
            .leftJoin('manager.user', 'user')
            .addSelect(['user.id', 'user.name'])
            .where('step.projectId = :projectId', { projectId })
            .andWhere('task.stepId = :stepId', { stepId })
            .orderBy('task.deadline', 'ASC')
            .addOrderBy('task.createdAt', 'ASC')
            .limit(5)
            .getMany();
    }

    // task 생성
    async createTaskWithQueryRunner(queryRunner: QueryRunner, step: Step): Promise<Task> {
        const task = queryRunner.manager.create(Task, {
            step,
            name: '빈 업무',
            memo: null,
            deadline: null,
        });
        return queryRunner.manager.save(task);
    }

    //task 저장
    async saveWithQueryRunner(queryRunner: QueryRunner, task: Task): Promise<Task> {
        return queryRunner.manager.save(Task, task);
    }

    // task 삭제
    async deleteWithQueryRunner(queryRunner: QueryRunner, taskId: number): Promise<void> {
        await queryRunner.manager.delete(Task, { id: taskId });
    }

    // step별 업무 더보기
    async findByProjectAndStepPaginated(
        projectId: number,
        stepId: number,
        limit: number,
        offset: number
    ): Promise<{ items: Task[]; totalCount: number }> {
        const listQb = this.repo
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.step', 'step')
            .leftJoin('task.managers', 'managerRel')
            .leftJoin('managerRel.user', 'user')
            .addSelect(['user.id', 'user.name'])
            .where('step.projectId = :projectId', { projectId })
            .andWhere('step.id = :stepId', { stepId })
            .orderBy('task.deadline', 'ASC')
            .addOrderBy('task.createdAt', 'ASC')
            .skip(offset)
            .take(limit);

        const items = await listQb.getMany();

        const totalCount = await this.repo
            .createQueryBuilder('task')
            .leftJoin('task.step', 'step')
            .where('step.projectId = :projectId', { projectId })
            .andWhere('step.id = :stepId', { stepId })
            .getCount();

        return { items, totalCount };
    }

    // status별 업무 더보기
    async findByProjectAndStatusPaginated(
        projectId: number,
        status: Status,
        limit: number,
        offset: number
    ): Promise<{ items: Task[]; totalCount: number }> {
        const listQb = this.repo
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.step', 'step')
            .leftJoin('task.managers', 'managerRel')
            .leftJoin('managerRel.user', 'user')
            .addSelect(['user.id', 'user.name'])
            .where('step.projectId = :projectId', { projectId })
            .andWhere('task.status = :status', { status })
            .orderBy('task.deadline', 'ASC')
            .addOrderBy('task.createdAt', 'ASC')
            .skip(offset)
            .take(limit);

        const items = await listQb.getMany();

        const totalCount = await this.repo
            .createQueryBuilder('task')
            .leftJoin('task.step', 'step')
            .where('step.projectId = :projectId', { projectId })
            .andWhere('task.status = :status', { status })
            .getCount();

        return { items, totalCount };
    }

    //  프로젝트와 날짜 범위에 따른 업무 일정 조회
    async findCalendarByProjectAndRange(
        projectId: number,
        startDate: Date,
        endDate: Date
    ): Promise<Array<{ id: number; name: string; date: Date }>> {
        return this.repo
            .createQueryBuilder('task')
            .leftJoin('task.step', 'step')
            .select(['task.deadline AS date', 'task.id AS id', 'task.name AS name'])
            .where('step.projectId = :projectId', { projectId })
            .andWhere('task.deadline BETWEEN :startDate AND :endDate', { startDate, endDate })
            .orderBy('task.deadline', 'ASC')
            .getRawMany();
    }

    /*
     * 진행중/시작전 업무를 마감일/생성일 기준으로 정렬하여 상위 N개 반환
     * (N+1 방지 위해: 1) id만 선조회 → 2) id들로 상세 로딩)
     */
    async findUserAssignedOngoingTasksForDashboard(
        projectId: number,
        userId: number,
        maxCardNum: number
    ): Promise<Task[]> {
        // 1) 조건에 맞는 task id만 선조회
        const idRows = await this.repo
            .createQueryBuilder('task')
            .leftJoin('task.step', 'step')
            .where('step.projectId = :projectId', { projectId })
            .andWhere('task.status IN (:...statuses)', {
                statuses: [Status.ONGOING, Status.NOTSTART],
            })
            .andWhere((qb) => {
                const sub = qb
                    .subQuery()
                    .select('1')
                    .from('manager', 'm') // 매니저 조인테이블 실제 이름 확인
                    .where('m.taskId = task.id')
                    .andWhere('m.userId = :userId', { userId })
                    .getQuery();
                return `EXISTS ${sub}`;
            })
            .orderBy('task.deadline IS NULL', 'ASC') // NULLS LAST
            .addOrderBy('task.deadline', 'ASC')
            .addOrderBy('task.createdAt', 'ASC')
            .limit(maxCardNum)
            .select('task.id', 'id')
            .getRawMany<{ id: number }>();

        const ids = idRows.map((r) => r.id);
        if (ids.length === 0) return [];

        // 2) id들로 상세 로딩 (step, managers, user까지)
        const tasks = await this.repo
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.step', 'step')
            .leftJoinAndSelect('task.managers', 'managers')
            .leftJoinAndSelect('managers.user', 'user')
            .whereInIds(ids)
            .orderBy('task.deadline IS NULL', 'ASC')
            .addOrderBy('task.deadline', 'ASC')
            .addOrderBy('task.createdAt', 'ASC')
            .getMany();

        const order = new Map(ids.map((id, i) => [id, i]));
        tasks.sort((a, b) => order.get(a.id)! - order.get(b.id)!);

        return tasks;
    }

    //프로젝트 기준 Task 조회용 공통 베이스 QB
    getProjectTasksBaseQb(projectId: number): SelectQueryBuilder<Task> {
        return this.repo
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.step', 'step')
            .leftJoinAndSelect('task.managers', 'manager')
            .leftJoinAndSelect('manager.user', 'user')
            .where('step.projectId = :projectId', { projectId });
    }
}
