import { Status } from '../../../common/enums/status.enum';
import { Task } from '../entities/tasks.entity';
import { Manager } from '../../mappings/managers/managers.entity';
import { UserProfile } from 'src/common/dtos/user-profile.dto';
import { User } from 'src/modules/users/entities/users.entity';

const toIsoOrNull = (d?: Date | null): string | null => (d ? d.toISOString() : null);

/** 생성 이벤트용 DTO */
export class CreatedTaskDTO {
    id: number;
    name: string;
    status: Status;
    deadline: string | null; // ISO8601 or null
    stepId: number;

    static from(task: Task, stepId: number): CreatedTaskDTO {
        const dto = new CreatedTaskDTO();
        dto.id = task.id;
        dto.name = task.name;
        dto.status = task.status;
        dto.deadline = toIsoOrNull(task.deadline);
        dto.stepId = stepId;
        return dto;
    }
}

/** 삭제 이벤트용 DTO */
export class DeletedTaskDTO {
    id: number;

    static from(taskId: number): DeletedTaskDTO {
        return { id: taskId } as DeletedTaskDTO;
    }
}

/** 업데이트 이벤트용 DTO
 *  - 변경된 필드만 싣는다 (id는 항상 포함)
 */
export class UpdatedTaskDTO {
    name?: string;
    status?: Status;
    deadline?: string | null; // ISO8601 or null
    stepId?: number;
    managers?: UserProfile[];

    static from(
        diff: Record<string, any>,
        entity: Task,
        managerEntities: Manager[] = []
    ): UpdatedTaskDTO {
        const dto = new UpdatedTaskDTO();
        if ('name' in diff) dto.name = entity.name;
        if ('status' in diff) dto.status = entity.status;
        if ('deadline' in diff) dto.deadline = toIsoOrNull(entity.deadline);
        if ('stepId' in diff) dto.stepId = entity.step.id;
        if ('managers' in diff) {
            dto.managers = managerEntities.map((m) => UserProfile.from(m.user as User));
        }
        return dto;
    }
}
