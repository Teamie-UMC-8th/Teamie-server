import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ProjectsService } from 'src/modules/projects/services/projects.service';
import { StepRepository } from '../repositories/step.repository';

@Injectable()
export class StepMemberGuard implements CanActivate {
    constructor(
        private readonly projectService: ProjectsService,
        private readonly stepRepository: StepRepository
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;
        const stepId = Number(request.params.stepId);
        const step = await this.stepRepository.findById(stepId);
        const projectId = step.project.id;
        return await this.projectService.assertProjectMember(userId, projectId);
    }
}
