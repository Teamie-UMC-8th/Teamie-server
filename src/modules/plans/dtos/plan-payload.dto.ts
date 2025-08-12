import { UserProfile } from 'src/common/dtos/user-profile.dto';
import { Plan } from '../entities/plan.entity';
import { BasicUpdatePlanReqDTO, UpdatePlanUserReqDTO } from './update-plan.dto';
import { PlanDetails } from './plan-details.dto';
import { pickFieldsFromEntity } from 'src/common/utils/dto-transform';

export class CreatedPlanDTO {
    id: number;
    date: string; //NOTE: ISO8601

    static from(entity: Plan): CreatedPlanDTO {
        const dto = new CreatedPlanDTO();
        dto.id = entity.id;
        dto.date = entity.date.toISOString();
        return dto;
    }
}

export class DeletedPlanDTO {
    id: number;

    static from(planId: number): DeletedPlanDTO {
        const dto = new DeletedPlanDTO();
        dto.id = planId;
        return dto;
    }
}

export class UpdatedPlanDTO {
    id: number;
    name?: string;
    date?: string; //NOTE: ISO8601
    startHour?: string; //NOTE: HH:MM:SS
    location?: string;
    attendees?: UserProfile[];
    memo?: string;
    writers?: UserProfile[];
    meetingRecords?: string;

    static from(
        req: BasicUpdatePlanReqDTO | UpdatePlanUserReqDTO,
        entity: PlanDetails
    ): UpdatedPlanDTO {
        const FIELDS: (keyof BasicUpdatePlanReqDTO | keyof UpdatePlanUserReqDTO)[] = [
            'name',
            'date',
            'startHour',
            'location',
            'attendees',
            'memo',
            'writers',
            'meetingRecords',
        ];

        const dto = pickFieldsFromEntity<
            BasicUpdatePlanReqDTO | UpdatePlanUserReqDTO,
            PlanDetails,
            UpdatedPlanDTO
        >(req, entity, FIELDS);
        dto.id = entity.id;
        return dto;
    }
}
