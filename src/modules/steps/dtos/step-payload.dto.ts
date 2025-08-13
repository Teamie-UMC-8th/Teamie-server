import { StepDeleteForBiddenException } from 'src/common/exceptions/custom.errors';
import { Step } from '../entities/steps.entity';
export class CreatedStepDTO {
    id: number;
    name: string;

    static from(entity: Step): CreatedStepDTO {
        const dto = new CreatedStepDTO();
        dto.id = entity.id;
        dto.name = entity.name;
        return dto;
    }
}

export class DeletedStepDTO {
    projectId: number;
    id: number;
    static from(projectId, stepId: number): DeletedStepDTO {
        const dto = new DeletedStepDTO();
        dto.projectId = projectId;
        dto.id = stepId;
        return dto;
    }
}

export class UpdatedStepDTO {
    projectId: number;
    id: number;
    name: string;
    static from(projectId: number, entity: Step): UpdatedStepDTO {
        const dto = new UpdatedStepDTO();
        dto.projectId = projectId;
        dto.id = entity.id;
        dto.name = entity.name;
        return dto;
    }
}
