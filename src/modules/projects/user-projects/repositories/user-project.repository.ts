import {
    ProjectForbiddenException,
    ProjectTransactionException,
} from 'src/common/exceptions/custom.errors';
import { Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { UserProject } from '../entities/user-projects.entity';
import { projectPermission } from 'src/common/enums/project-permission.enum';
import { EntityManager } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entities/users.entity';
@Injectable()
export class UserProjectRepository {
    constructor(
        @InjectRepository(UserProject)
        private readonly userProjectRepository: Repository<UserProject>
    ) {}

    async saveUserProject(userProject: UserProject, manager: EntityManager) {
        return await manager.save(userProject);
    }

    async findUserProject(userId: number, projectId: number): Promise<UserProject | null> {
        const userProject = await this.userProjectRepository.findOne({
            where: { project: { id: projectId }, user: { id: userId } },
        });
        return userProject;
    }
    async findUsersByProjectId(projectId: number) {
        const users = await this.userProjectRepository.find({
            where: { project: { id: projectId } },
            relations: ['user'],
        });
        return users;
    }

    async findAllByProjectId(projectId: number): Promise<UserProject[]> {
        return await this.userProjectRepository.find({
            where: { project: { id: projectId } },
            relations: ['user', 'user.managers', 'user.managers.task'],
        });
    }

    async findAllWithProjectByUserId(userId: number) {
        return await this.userProjectRepository.find({
            where: { user: { id: userId }, project: { isCompleted: false } },
            relations: ['project'],
            select: {
                project: {
                    id: true,
                    name: true,
                },
                permission: true,
                createdAt: true,
            },
            order: {
                createdAt: 'ASC',
            },
        });
    }

    async findAllByUserIds(projectId: number, userIds: number[]) {
        return await this.userProjectRepository.find({
            where: {
                user: { id: In(userIds) },
                project: { id: projectId },
            },
        });
    }

    async findProjectLeaderNameByProjectId(projectId: number): Promise<string> {
        const up = await this.userProjectRepository
            .createQueryBuilder('up')
            .innerJoinAndSelect('up.user', 'u') // User 엔티티까지 함께 로드
            .where('up.projectId = :projectId', { projectId })
            .andWhere('up.permission = :perm', { perm: projectPermission.LEAD })
            .getOneOrFail(); // 결과 없으면 예외 발생
        return up.user.name;
    }

    async findWithPermission(
        userId: number,
        projectId: number,
        manager: EntityManager
    ): Promise<projectPermission | null> {
        const row = await manager
            .getRepository(UserProject)
            .createQueryBuilder('up')
            .select('up.permission', 'permission') // alias 고정
            .where('up.userId = :userId', { userId })
            .andWhere('up.projectId = :projectId', { projectId })
            .limit(1)
            .getRawOne<{ permission: projectPermission }>();

        return row?.permission ?? null;
    }

    // assert - GET 전용 단순 검증용
    async findById(userId: number, projectId: number): Promise<boolean> {
        return await this.userProjectRepository.exists({
            where: { user: { id: userId }, project: { id: projectId } },
        });
    }

    async findAllUsingQR(projectId: number, manager: EntityManager): Promise<UserProject[]> {
        return await manager.getRepository(UserProject).find({
            where: { project: { id: projectId } },
            relations: ['user', 'user.managers', 'user.managers.task'],
        });
    }

    async findUserProjectUsingQR(
        projectId: number,
        userId: number,
        manager: EntityManager
    ): Promise<UserProject | null> {
        const userProject = manager.getRepository(UserProject).findOne({
            where: { project: { id: projectId }, user: { id: userId } },
        });
        return userProject;
    }

    // is - db 트랜잭션 전 검증용
    async findByIdUsingQR(
        userId: number,
        projectId: number,
        manager: EntityManager
    ): Promise<boolean> {
        const repo = manager.getRepository(UserProject);
        return await repo.exists({
            where: { user: { id: userId }, project: { id: projectId } },
        });
    }

    async findProjectLeaderByProjectIdUsingQR(
        projectId: number,
        manager: EntityManager
    ): Promise<{ oldLeaderId: number } | undefined> {
        const repo = manager.getRepository(UserProject);
        return await repo
            .createQueryBuilder('up')
            .select('up.userId', 'oldLeaderId')
            .where('up.projectId = :projectId', { projectId })
            .andWhere('up.permission = :perm', { perm: projectPermission.LEAD })
            .getRawOne<{ oldLeaderId: number }>();
    }

    // 완료 시 멤버들의 projectNum +1
    async updateProjectNum(projectId: number, manager: EntityManager): Promise<void> {
        const raws = await manager
            .getRepository(UserProject)
            .createQueryBuilder('up')
            .leftJoin('up.user', 'user')
            .select(['up.userId AS userId', 'user.projectNum AS projectNum'])
            .where('up.projectId = :projectId', { projectId })
            .getRawMany<{ userId: number; projectNum: number | string | null }>();

        for (const { userId, projectNum } of raws) {
            const base = projectNum == null ? 0 : Number(projectNum); // ← 문자열/NULL 안전
            const next = base + 1;
            await manager.update(User, { id: userId }, { projectNum: next }); // PK는 id
        }
    }

    //프로젝트 내 역할 변경
    async updateUserRole(
        projectId: number,
        userId: number,
        role: string,
        manager: EntityManager
    ): Promise<UserProject> {
        const up = await this.findUserProjectUsingQR(projectId, userId, manager);
        if (!up) throw new ProjectForbiddenException();
        up.role = role;
        return await manager.save(UserProject, up);
    }

    //LEAD, MEMBER 권한 변경
    async updatePermission(
        projectId: number,
        userId: number,
        permission: projectPermission,
        manager: EntityManager
    ): Promise<UserProject> {
        const up = await this.findUserProjectUsingQR(projectId, userId, manager);
        if (!up) throw new ProjectForbiddenException();
        up.permission = permission;
        return await manager.save(UserProject, up);
    }
}
