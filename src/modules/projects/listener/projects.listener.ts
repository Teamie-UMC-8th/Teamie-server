import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppGateway } from 'src/infra/gateway/app.gateway';
import { ValidatePayloadDto } from 'src/infra/gateway/dtos/subscribe-payload.dto';
import { ProjectRepository } from '../repositories/project.repository';
import { UserProjectRepository } from '../user-projects/repositories/user-project.repository';

@Injectable()
export class ProjectsListener {
    constructor(
        private readonly gateway: AppGateway,
        private readonly projectRepository: ProjectRepository,
        private readonly userProjectRepository: UserProjectRepository
    ) {}

    /* projectId validation */
    @OnEvent(`project.validate`, { async: true })
    async validateTaskId(dto: ValidatePayloadDto) {
        const { payload, client } = dto;
        const id = payload.id;
        const userId = client.data.user;
        try {
            await this.projectRepository.findByProjectId(id);
            const isProjectMember = await this.userProjectRepository.findUserProject(userId, id);
            if (!isProjectMember) {
                client.emit('exception', {
                    message: `NOT_PROJECT_MEMBER(${id})`,
                });
            }
        } catch (err) {
            client.emit('exception', {
                message: `PROJECT_NOT_FOUND(${id})`,
            });
            await this.gateway.handleUnsubscribe(payload, client);
        }
    }
}
