import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Project } from '../entities/projects.entity';
import { UserProject } from '../entities/userProjects.entity';
import {
    ProjectNotFoundException,
    ProjectTransactionException,
    AlreadyProjectCompletedException,
} from 'src/common/exceptions/custom.errors';
import { projectPermission } from 'src/common/enums/project-permission.enum';

@Injectable()
export class ProjectRepository {
    constructor(
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>
    ) {}

    private m(manager?: EntityManager) {
        return manager ?? this.projectRepository.manager;
    }

    async findProjectName(projectId: number): Promise<Project> {
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            select: ['id', 'name'],
        });
        if (!project) throw new ProjectNotFoundException();
        return project;
    }

    async findAllUserProjectsByProjectId(
        projectId: number,
        manager?: EntityManager
    ): Promise<UserProject[]> {
        const m = this.m(manager);
        return await m.find(UserProject, {
            where: { project: { id: projectId } },
            relations: ['user', 'user.managers', 'user.managers.task'],
        });
    }

    // 프로젝트 저장 (트랜잭션 컨텍스트 주입)
    async saveProject(project: Project, manager: EntityManager): Promise<Project> {
        return await manager.save(Project, project);
    }
    // userProject 저장
    async saveUserProject(userProject: UserProject, manager: EntityManager) {
        return await manager.save(userProject);
    }

    async createProjectWithLeader(
        name: string,
        ownerUserId: number,
        manager: EntityManager
    ): Promise<Project> {
        try {
            const saved = await manager.save(Project, {
                name,
                goal: '',
                rule: '',
                isCompleted: false,
                completedAt: null,
            });

            await manager.save(UserProject, {
                user: { id: ownerUserId },
                project: saved,
                permission: projectPermission.LEAD,
                role: '',
            });

            return saved;
        } catch (e) {
            throw new ProjectTransactionException();
        }
    }

    async isProjectEditable(projectId: number): Promise<Project> {
        const project = await this.projectRepository.findOne({ where: { id: projectId } });
        if (!project) throw new ProjectNotFoundException();
        if (project.isCompleted) throw new AlreadyProjectCompletedException();
        return project;
    }

    async isProjectExist(projectId: number): Promise<Project> {
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            relations: [
                'userProjects',
                'userProjects.user',
                'userProjects.user.managers',
                'userProjects.user.managers.task',
            ],
        });
        if (!project) throw new ProjectNotFoundException();
        return project;
    }
}
