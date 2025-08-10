import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Project } from '../entities/projects.entity';
import {
    ProjectNotFoundException,
    ProjectTransactionException,
    AlreadyProjectCompletedException,
} from 'src/common/exceptions/custom.errors';

@Injectable()
export class ProjectRepository {
    constructor(
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>
    ) {}

    async findProjectName(projectId: number, manager:EntityManager): Promise<Project|null> {
        const repo = manager.getRepository(Project)
        const project = repo.findOne({
            where: { id: projectId },
            select: ['id', 'name'],
        });
        return project;
    }
    // 프로젝트 저장 (트랜잭션 컨텍스트 주입)
    async saveProject(project: Project, manager: EntityManager): Promise<Project> {
        try {
            return await manager.save(Project, project);
        }catch(e) {
            throw new ProjectTransactionException();
        }
    }

    async createProject(name: string, manager: EntityManager): Promise<Project> {
        try {
            const saved = await manager.save(Project, {
                name,
                goal: '',
                rule: '',
                isCompleted: false,
                completedAt: null,
            });

            return saved;
        } catch (e) {
            throw new ProjectTransactionException();
        }
    }

    async isProjectEditable(projectId: number, manager: EntityManager): Promise<Project> {
        const project = await manager
    .getRepository(Project)
    .createQueryBuilder('p')
    .where('p.id = :id', { id: projectId })
    .setLock('pessimistic_write') // 같은 트랜잭션에서만 의미 있음
    .getOne();

  if (!project) throw new ProjectNotFoundException();
  if (project.isCompleted) throw new AlreadyProjectCompletedException();
  return project;
    }

    async isProjectExist(projectId: number, manager: EntityManager): Promise<Project> {
        const repo = manager.getRepository(Project);
        const project = await repo.findOne({
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
