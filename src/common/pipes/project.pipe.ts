import {
  PipeTransform,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { ProjectsService } from '../../modules/projects/projects.service';

@Injectable()
export class ValidateProjectAccessPipe implements PipeTransform {
  constructor(private readonly projectsService: ProjectsService) {}

  async transform(projectId: any, { metatype, type }: any): Promise<number> {
    const userId = metatype.userId; 

    const isMember = await this.projectsService.checkProjectMembership(userId, projectId);
    if (!isMember) throw new ForbiddenException('해당 프로젝트에 접근 권한이 없습니다.');

    return projectId;
  }
}


@Injectable()
export class IsProjectLeaderPipe implements PipeTransform {
  constructor(private readonly projectsService: ProjectsService) {}

  async transform(value: { projectId: number; userId: number }) {
    const { projectId, userId } = value;

    const isMember = await this.projectsService.checkProjectMembership(userId, projectId);
    if (!isMember) {
      throw new ForbiddenException('해당 프로젝트에 접근 권한이 없습니다.');
    }

    const isLeader = await this.projectsService.checkProjectLeader(userId, projectId);
    if (!isLeader) {
      throw new ForbiddenException('프로젝트 팀장만 가능합니다.');
    }

    return projectId; 
  }
}