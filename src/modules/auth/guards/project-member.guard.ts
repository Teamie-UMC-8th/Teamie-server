import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ProjectsService } from 'src/modules/projects/services/projects.service';

@Injectable()
export class ProjectMemberGuard implements CanActivate {
    constructor(private readonly projectService: ProjectsService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.userId;
        const projectId = Number(request.params.projectId);
        return await this.projectService.isProjectMember(userId, projectId, request.queryRunner);
    }
}
