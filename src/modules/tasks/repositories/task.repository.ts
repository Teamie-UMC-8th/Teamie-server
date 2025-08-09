import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Task } from '../entities/tasks.entity';
import { TaskNotFoundException } from 'src/common/exceptions/custom.errors';
import { QueryRunner } from 'typeorm';
import { Status } from '../../../common/enums/status.enum';

@Injectable()
export class TaskRepository {
    constructor(
        @InjectRepository(Task)
        private readonly repo: Repository<Task>
    ) {}

    /* =======================
     * Task 조회 관련 메서드
     * =======================
     */

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

    //프로젝트 기준 Task 조회용 공통 베이스 QB
    getProjectTasksBaseQb(projectId: number): SelectQueryBuilder<Task> {
        return this.repo
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.step', 'step')
            .leftJoinAndSelect('task.managers', 'manager')
            .leftJoinAndSelect('manager.user', 'user')
            .where('step.projectId = :projectId', { projectId });
    }

    /* =======================
     * Task 생성/수정/삭제 관련 메서드
     * =======================
     */

    //task 저장
    async saveWithQueryRunner(queryRunner: QueryRunner, task: Task): Promise<Task> {
        return queryRunner.manager.save(Task, task);
    }

    // task 삭제
    async deleteWithQueryRunner(queryRunner: QueryRunner, taskId: number): Promise<void> {
        await queryRunner.manager.delete(Task, { id: taskId });
    }

    /* =======================
     * Task 조회 조건 및 페이징 관련 메서드
     * =======================
     */

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
        status: string,
        limit: number
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
            .limit(limit)
            .getMany();
    }

    // step 별로 업무 5개씩 조회 마감기한 오름차순
    async findTop5ByProjectIdAndStepOrderByDeadlineAsc(
        projectId: number,
        stepId: number,
        limit: number
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
            .limit(limit)
            .getMany();
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

    /* =======================
     * Task 페이징 관련 메서드
     * =======================
     */

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

    /* =======================
     * Task 프로젝트 별 나의 업무 조회
     * =======================
     */

    //조건에 맞는 task들의 ID만 반환
    async findTaskIdsForUserAssignedOngoingTasks(
        projectId: number,
        userId: number,
        statuses: Status[],
        maxCardNum: number
    ): Promise<{ id: number }[]> {
        return this.repo
            .createQueryBuilder('task')
            .leftJoin('task.step', 'step')
            .where('step.projectId = :projectId', { projectId })
            .andWhere('task.status IN (:...statuses)', { statuses })
            .andWhere((qb) => {
                const sub = qb
                    .subQuery()
                    .select('1')
                    .from('manager', 'm')
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
            .getRawMany();
    }

    //주어진 ID들의 task 상세 정보 배열 반환
    async findTasksByIds(ids: number[]): Promise<Task[]> {
        return this.repo
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.step', 'step')
            .leftJoinAndSelect('task.managers', 'managers')
            .leftJoinAndSelect('managers.user', 'user')
            .whereInIds(ids)
            .getMany();
    }
}
