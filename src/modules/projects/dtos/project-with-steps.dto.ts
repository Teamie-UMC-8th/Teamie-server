import { Step } from 'src/modules/steps/entities/steps.entity';

export class ProjectWithStepsDto {
    id: number;
    name: string;
    steps: Array<{ taskId: number; name: string }>;

    static fromEntity(project: { id: number; name: string; steps: Step[] }): ProjectWithStepsDto {
        const dto = new ProjectWithStepsDto();
        dto.id = project.id;
        dto.name = project.name;
        dto.steps = project.steps.map((step) => ({
            taskId: step.id,
            name: step.name,
        }));
        return dto;
    }
}
