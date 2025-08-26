import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { Task } from '../entities/tasks.entity';
import { TaskNotFoundException } from 'src/common/exceptions/custom.errors';
import { QueryRunner } from 'typeorm';
import { Status } from '../../../common/enums/status.enum';
import { GetSearchTaskDto } from '../dtos/get-search-task.dto';
import { Brackets } from 'typeorm';

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
    async findByIdUsingQR(queryRunner: QueryRunner, taskId: number): Promise<Task> {
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
            .leftJoinAndSelect('task.step', 'step', 'step.projectId = :projectId', { projectId })
            .leftJoinAndSelect('task.managers', 'manager')
            .leftJoinAndSelect('manager.user', 'user')
            .where('step.projectId = :projectId', { projectId });
    }

    /* =======================
     * Task 생성/수정/삭제 관련 메서드
     * =======================
     */

    //task 저장
    async saveWithQueryRunner(manager: EntityManager, task: Task): Promise<Task> {
        return await manager.save(Task, task);
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
            .leftJoinAndSelect('task.managers', 'manager')
            .leftJoinAndSelect('manager.user', 'user')
            .where('step.projectId = :projectId', { projectId })
            .andWhere('task.status = :status', { status })
            .orderBy('task.deadline IS NULL', 'ASC') // NULLS LAST
            .addOrderBy('task.deadline', 'ASC')
            .addOrderBy('task.createdAt', 'ASC')
            .distinct(true)
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
            .leftJoinAndSelect('task.managers', 'manager')
            .leftJoinAndSelect('manager.user', 'user')
            .where('step.projectId = :projectId', { projectId })
            .andWhere('step.id = :stepId', { stepId })
            .orderBy('task.deadline IS NULL', 'ASC') // NULLS LAST
            .addOrderBy('task.deadline', 'ASC')
            .addOrderBy('task.createdAt', 'ASC')
            .distinct(true)
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
            .orderBy('task.deadline IS NULL', 'ASC') // NULLS LAST
            .addOrderBy('task.deadline', 'ASC')
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
            .orderBy('task.deadline IS NULL', 'ASC') // NULLS LAST
            .addOrderBy('task.deadline', 'ASC')
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
        maxCardNum: number,
        cursor?: { deadline: string; createdAt: string }
    ): Promise<{ id: number }[]> {
        const qb = this.repo
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
            .orderBy("IFNULL(task.deadline, '9999-12-31')", 'ASC') // NULLS LAST
            .addOrderBy('task.createdAt', 'ASC');

        // 커서가 있는 경우 복합 조건 추가
        if (cursor) {
            qb.andWhere(
                `(IFNULL(task.deadline, '9999-12-31'), task.createdAt) > (:deadline, :createdAt)`,
                {
                    deadline: cursor.deadline ?? '999-12-31',
                    createdAt: cursor.createdAt,
                }
            );
        }

        return await qb.limit(maxCardNum).select('task.id', 'id').getRawMany();
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

    /* =======================
     * Task 검색
     * =======================
     */

    //BaseQb  + dto 기반 필터 헬퍼 함수 (검색에서 필터링하는 함수)
    async applySearchFilters(qb: SelectQueryBuilder<Task>, dto: GetSearchTaskDto) {
        if (dto.statuses?.length) {
            qb.andWhere('task.status IN (:...statuses)', { statuses: dto.statuses });
        }
        if (dto.managerIds?.length) {
            qb.andWhere('user.id IN (:...managerIds)', { managerIds: dto.managerIds });
        }
        // 날짜 필터: 둘 다 ⇒ AND, 하나만 ⇒ 그 하나만
        if (dto.dateBefore || dto.dateAfter) {
            qb.andWhere(
                new Brackets((q) => {
                    if (dto.dateAfter && dto.dateBefore) {
                        // AND 범위 필터
                        q.where('task.deadline >= :dateAfter', {
                            dateAfter: `${dto.dateAfter} 00:00:00`,
                        }).andWhere('task.deadline <= :dateBefore', {
                            dateBefore: `${dto.dateBefore} 23:59:59`,
                        });
                    } else if (dto.dateAfter) {
                        q.where('task.deadline >= :dateAfter', {
                            dateAfter: `${dto.dateAfter} 00:00:00`,
                        });
                    } else if (dto.dateBefore) {
                        q.where('task.deadline <= :dateBefore', {
                            dateBefore: `${dto.dateBefore} 23:59:59`,
                        });
                    }
                })
            );
        }

        return qb;
    }

    // --- totalCount (검색 포함)
    async findCountByProjectIdWithFilters(
        projectId: number,
        dto: GetSearchTaskDto
    ): Promise<number> {
        const qb = this.getProjectTasksBaseQb(projectId);
        this.applySearchFilters(qb, dto);
        return qb.clone().select('task.id').distinct(true).getCount();
    }

    // 진행 상황별 Top-N (검색 포함)
    async findTop5SearchByProjectIdAndStatusOrderByDeadlineAsc(
        projectId: number,
        status: Status,
        limit: number,
        dto: GetSearchTaskDto
    ): Promise<Task[]> {
        const qb = this.getProjectTasksBaseQb(projectId); // 공통 베이스
        this.applySearchFilters(qb, dto); // 검색 필터 적용

        qb.andWhere('task.status = :status', { status }).distinct(true);
        this.orderByDeadlineNullsLast(qb);
        qb.take(limit);

        return qb.getMany();
    }

    // 스텝별 Top-N (검색 포함)
    async findTop5SearchByProjectIdAndStepOrderByDeadlineAsc(
        projectId: number,
        stepId: number,
        limit: number,
        dto: GetSearchTaskDto
    ): Promise<Task[]> {
        const qb = this.getProjectTasksBaseQb(projectId);
        this.applySearchFilters(qb, dto);

        qb.andWhere('step.id = :stepId', { stepId }).distinct(true);
        this.orderByDeadlineNullsLast(qb);
        qb.take(limit); //  조인 중복 방지

        return qb.getMany();
    }

    // step별 업무 더보기 (검색 포함)
    async findSearchByProjectAndStepPaginated(
        projectId: number,
        stepId: number,
        limit: number,
        offset: number,
        dto: GetSearchTaskDto
    ): Promise<{ items: Task[]; totalCount: number }> {
        // 목록 쿼리
        const listQb = this.getProjectTasksBaseQb(projectId);
        this.applySearchFilters(listQb, dto); //  검색 필터 적용
        listQb.andWhere('step.id = :stepId', { stepId }).distinct(true);
        this.orderByDeadlineNullsLast(listQb);
        listQb.skip(offset).take(limit); //  조인 중복 방지

        const items = await listQb.getMany();

        // 전체 개수 (동일 필터 + distinct count)
        const countQb = this.getProjectTasksBaseQb(projectId);
        this.applySearchFilters(countQb, dto);
        countQb.andWhere('step.id = :stepId', { stepId });

        const totalCount = await countQb.clone().select('task.id').distinct(true).getCount();

        return { items, totalCount };
    }

    // status별 업무 더보기 (검색 포함)
    async findSearchByProjectAndStatusPaginated(
        projectId: number,
        status: Status,
        limit: number,
        offset: number,
        dto: GetSearchTaskDto
    ): Promise<{ items: Task[]; totalCount: number }> {
        // 목록 쿼리
        const listQb = this.getProjectTasksBaseQb(projectId);
        this.applySearchFilters(listQb, dto);
        listQb.andWhere('task.status = :status', { status }).distinct(true);
        this.orderByDeadlineNullsLast(listQb);
        listQb.skip(offset).take(limit);

        const items = await listQb.getMany();

        // 전체 개수
        const countQb = this.getProjectTasksBaseQb(projectId);
        this.applySearchFilters(countQb, dto);
        countQb.andWhere('task.status = :status', { status });

        const totalCount = await countQb.clone().select('task.id').distinct(true).getCount();

        return { items, totalCount };
    }

    // 공통 헬퍼
    private orderByDeadlineNullsLast(qb: SelectQueryBuilder<Task>) {
        qb.addSelect('CASE WHEN task.deadline IS NULL THEN 1 ELSE 0 END', 'deadline_null_rank')
            .orderBy('deadline_null_rank', 'ASC')
            .addOrderBy('task.deadline', 'ASC')
            .addOrderBy('task.createdAt', 'ASC');
        return qb;
    }
}
