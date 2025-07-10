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
@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    @InjectRepository(UserProject)
    private readonly userProjectRepository: Repository<UserProject>,

    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,

    private readonly configService: ConfigService,
    
  ) {}

  async createProject(dto:CreateProjectDto, userId: number) {
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
    await this.cacheManager.set(key, savedProject, ttlSeconds);

    const baseUrl = this.configService.get('BASE_URL');
    const inviteCode = `${baseUrl}/projects/join/${code}`;


    return CommonResponse.success(CreateProjectResponseDto.fromEntity(project, inviteCode));
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
