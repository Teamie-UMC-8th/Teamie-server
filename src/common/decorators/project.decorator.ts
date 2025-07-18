import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ProjectIdWithUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const projectId = Number(req.params.projectId);
    const userId = req.user?.id;
    return { projectId, userId };
});

export const IsProjectLeader = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
        projectId: Number(request.params.projectId),
        userId: request.user.id,
    };
});
