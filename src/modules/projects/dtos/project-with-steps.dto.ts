import { Step } from 'src/modules/steps/entities/steps.entity';
import { CreateStepDto, CreateStepResponseDto } from 'src/modules/steps/dtos/create-step.dto';

export class StepResponseDto {
    id: number;
    name: string;
    step: CreateStepResponseDto;

    static fromEntity(input: {
        id: number;
        name: string;
        step: CreateStepResponseDto;
    }): StepResponseDto {
        const dto = new StepResponseDto();
        dto.id = input.id;
        dto.name = input.name;
        dto.step = input.step;
        return dto;
    }
}
