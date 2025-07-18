import {
  PipeTransform,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { ProjectsService } from '../../modules/projects/projects.service';
import { ProjectUpdateForbiddenException, ProjectForbiddenException } from '../exceptions/custom.errors';

@Injectable()
export class ValidateProjectAccessPipe implements PipeTransform {
  constructor(private readonly projectsService: ProjectsService) {}

  async transform(value: { projectId: number; userId: number }): Promise<number> {
    const { projectId, userId } = value;

    const isMember = await this.projectsService.checkProjectMembership(userId, projectId);
    if (!isMember) throw new ProjectForbiddenException();

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
      throw new ProjectForbiddenException();
    }

    const isLeader = await this.projectsService.checkProjectLeader(userId, projectId);
    if (!isLeader) {
      throw new ProjectUpdateForbiddenException('해당 부분은 팀장만 수정할 수 있습니다.');
    }

    return projectId; 
  }
}