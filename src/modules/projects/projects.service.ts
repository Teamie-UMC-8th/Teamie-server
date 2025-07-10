import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/projects.entity';
import { UserProject } from '../mappings/userProjects/userProjects.entity';
import { Repository } from 'typeorm';
import { projectPermission } from 'src/common/enums/projectPermission.enum';
import { CreateProjectDto, CreateProjectResponseDto } from './dto/create-project.dto';
import {  CACHE_MANAGER  } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { CommonResponse } from '../../common/response/common-response.dto';
import { UserInProjectDto, AllProjectResponseDto ,  PostDto} from './dto/all-project-response.dto';
@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    @InjectRepository(UserProject)
    private readonly userProjectRepository: Repository<UserProject>,


    @Inject('REDIS_CLIENT')
    private readonly redis: Cache, private readonly configService: ConfigService,
  ) {}

  async createProject(dto:CreateProjectDto, userId: number):Promise<CommonResponse<CreateProjectResponseDto>> {
    const {name} = dto;
    const project = this.projectRepository.create({
      name,
      goal: '',
      rule: '',
      isCompleted: false,
      completedAt: undefined,
    });

    const savedProject = await this.projectRepository.save(project);

    const userProject = this.userProjectRepository.create({
      user: { id: userId }, // User 엔티티의 id를 사용하여 관계 설정
      project: savedProject,
      permission: projectPermission.LEAD,
      role: '',
    });

    await this.userProjectRepository.save(userProject);

    const code = generateRandomCode();
    const key = `invite:${code}`;
    const ttlSeconds = 60 * 60 * 24 *7 ;  //7일
    await this.redis.set(key, savedProject.id.toString(),  ttlSeconds );

    const baseUrl = this.configService.get('BASE_URL');
    const inviteCode = `${baseUrl}/projects/join/${code}`;


    return CommonResponse.success(CreateProjectResponseDto.fromEntity(project, inviteCode));
  }

  async getProjectByInviteCode(inviteCode: string): Promise<Project | null> {
    const key = `invite:${inviteCode}`;
    const projectId = await this.redis.get<Project>(key);
    return projectId || null;
  }

  async isUserInProject(userId: number, projectId: number): Promise<boolean> {
    return await this.userProjectRepository.exists({where: { user: { id: userId }, project: { id: projectId } }});
  }
  
  async addUserToProject(userId: number, projectId: number, role: string): Promise<void> {
    const userProject = this.userProjectRepository.create({
      user: { id: userId },
      project: { id: projectId },
      permission: projectPermission.MEMBER,
      role,
    });
    await this.userProjectRepository.save(userProject);
  }

  async getProjectFullData(projectId: number): Promise<CommonResponse<AllProjectResponseDto>> {
  const project = await this.projectRepository.findOneOrFail({ where: { id: projectId } });

  const userProjects = await this.userProjectRepository.find({
    where: { project: { id: projectId } },
    relations: ['user', 'user.managers', 'user.managers.task'],
  });

  const users = userProjects.map(UserInProjectDto.from);

  const key = `posts:${projectId}`;
  const postsRaw = await this.redis.get(key) || [];
  const posts = Array.isArray(postsRaw) ? postsRaw.map(PostDto.from) : [];

  return CommonResponse.success(AllProjectResponseDto.fromEntity({ project, users, posts }));
  }
}

export function generateRandomCode(length=10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code;
}
