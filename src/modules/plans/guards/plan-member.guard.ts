import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ProjectsService } from 'src/modules/projects/services/projects.service';
import { PlanRepository } from '../repositories/plan.repository';

@Injectable()
export class PlanMemberGuard implements CanActivate {
    constructor(
        private readonly projectService: ProjectsService,
        private readonly planRepository: PlanRepository
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;
        const planId = Number(request.params.planId);
        const plan = await this.planRepository.findByIdWithProjectId(planId);
        const projectId = plan.project.id;
        return await this.projectService.assertProjectMember(userId, projectId);
    }
}
