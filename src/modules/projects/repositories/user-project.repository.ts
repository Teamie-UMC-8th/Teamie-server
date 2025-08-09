import {
    ProjectForbiddenException,
    ProjectTransactionException,
    ProjectUpdateForbiddenException,
} from 'src/common/exceptions/custom.errors';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserProject } from '../entities/userProjects.entity';
import { projectPermission } from 'src/common/enums/project-permission.enum';
import { EntityManager } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/common/decorators/user.decorator';
@Injectable()
export class UserProjectRepository {
    constructor(
        @InjectRepository(UserProject)
        private readonly userProjectRepository: Repository<UserProject>
    ) {}
    async findUserProject(projectId: number, userId: number): Promise<UserProject> {
        const userProject = await this.userProjectRepository.findOne({
            where: { project: { id: projectId }, user: { id: userId } },
        });
        if (!userProject) throw new ProjectForbiddenException();
        return userProject;
    }
    async findUsersByProjectId(projectId: number) {
        const users = await this.userProjectRepository.find({
            where: { project: { id: projectId } },
            relations: ['user'],
        });
        return users;
    }

    async findProjectLeaderByProjectId(
        projectId: number
    ): Promise<{ oldLeaderId: number } | undefined> {
        return await this.userProjectRepository
            .createQueryBuilder('up')
            .select('up.userId', 'oldLeaderId')
            .where('up.projectId = :projectId', { projectId })
            .andWhere('up.permission = :perm', { perm: projectPermission.LEAD })
            .getRawOne<{ oldLeaderId: number }>();
    }

    // 완료 시 멤버들의 projectNum +1
    async updateProjectNum(projectId: number, manager: EntityManager): Promise<void> {
        const raws = await this.userProjectRepository
            .createQueryBuilder('up')
            .leftJoin('up.user', 'user')
            .select(['up.userId AS userId', 'user.projectNum AS projectNum'])
            .where('up.projectId = :projectId', { projectId })
            .getRawMany<{ userId: number; projectNum: number }>();

        for (const { userId, projectNum } of raws) {
            await manager.update(User, { id: userId }, { projectNum: projectNum + 1 });
        }
    }

    //멤버로 프로젝트에 추가
    async saveMemberToProject(
        userId: number,
        projectId: number,
        role: string,
        manager: EntityManager
    ): Promise<void> {
        try {
            await manager.save(UserProject, {
                user: { id: userId },
                project: { id: projectId },
                permission: projectPermission.MEMBER,
                role,
            });
        } catch {
            throw new ProjectTransactionException();
        }
    }
    //LEAD, MEMBER 권한 변경
    async updateUserRole(
        projectId: number,
        userId: number,
        role: string,
        manager: EntityManager
    ): Promise<UserProject> {
        const up = await this.findUserProject(projectId, userId);
        try {
            up.role = role;
            return await manager.save(UserProject, up);
        } catch {
            throw new ProjectTransactionException();
        }
    }

    async isProjectLeader(userId: number, projectId: number): Promise<projectPermission | null> {
        const mapping = await this.userProjectRepository
            .createQueryBuilder('up')
            .select(['up.permission'])
            .where('up.userId = :userId', { userId })
            .andWhere('up.projectId = :projectId', { projectId })
            .getRawOne();

        return mapping;
    }

    async isUserInProject(userId: number, projectId: number): Promise<boolean> {
        return await this.userProjectRepository.exists({
            where: { user: { id: userId }, project: { id: projectId } },
        });
    }
}
