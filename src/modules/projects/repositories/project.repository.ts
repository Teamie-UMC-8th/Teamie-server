import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Project } from '../entities/projects.entity';
import {
    ProjectNotFoundException,
    ProjectTransactionException,
} from 'src/common/exceptions/custom.errors';

@Injectable()
export class ProjectRepository {
    constructor(
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>
    ) {}

    async findProjectName(projectId: number): Promise<Project | null> {
        const project = this.projectRepository.findOne({
            where: { id: projectId },
            select: ['id', 'name'],
        });
        return project;
    }

    async findProjectNameUsingQR(
        projectId: number,
        manager: EntityManager
    ): Promise<Project | null> {
        const project = manager.getRepository(Project).findOne({
            where: { id: projectId },
            select: ['id', 'name'],
        });
        return project;
    }

    // assert - GET 전용 단순 검증용
    async findByProjectId(projectId: number): Promise<Project> {
        const project = await this.projectRepository
            .createQueryBuilder('p')
            .where('p.id = :id', { id: projectId })
            .getOne();

        if (!project) throw new ProjectNotFoundException();
        return project;
    }
    // is - db 트랜잭션 전 검증용
    async findByProjectIdUsingQR(projectId: number, manager: EntityManager): Promise<Project> {
        const project = await manager
            .getRepository(Project)
            .createQueryBuilder('p')
            .where('p.id = :id', { id: projectId })
            .getOne();

        if (!project) throw new ProjectNotFoundException();
        return project;
    }

    async findByIdWithTask(projectId: number): Promise<Project> {
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
    async findByIdWithTaskUsingQR(
        projectId: number,
        manager: EntityManager
    ): Promise<Project | null> {
        const project = manager.getRepository(Project).findOne({
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

    // 프로젝트 저장 (트랜잭션 컨텍스트 주입)
    async saveProject(project: Project, manager: EntityManager): Promise<Project> {
        try {
            return await manager.save(Project, project);
        } catch (e) {
            throw new ProjectTransactionException();
        }
    }

    //프로젝트 종료 여부
    async findIsCompletedByProjectId(projectId: number): Promise<boolean> {
        const result = await this.projectRepository
            .createQueryBuilder('project')
            .select('project.isCompleted', 'isCompleted')
            .where('project.id = :projectId', { projectId })
            .getRawOne<{ isCompleted: boolean }>();

        if (!result) {
            throw new ProjectNotFoundException();
        }

        return result.isCompleted;
    }
}
