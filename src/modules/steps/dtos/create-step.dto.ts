import { IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Step } from "../entities/steps.entity";
import { CreateTaskResponseDto } from "../../tasks/dtos/create-task.dto";

export class CreateStepDto {
    @ApiProperty({
        example: "기획 단계",
        description: "생성할 Step의 이름",
    })
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        example: 1,
        description: "프로젝트 ID",
    })
    @IsNotEmpty()
    projectId: number;
}