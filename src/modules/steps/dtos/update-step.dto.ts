import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class UpdateStepDto {
    @ApiProperty({
        example: '기획 단계',
        description: '수정할 Step의 이름',
    })
    @IsNotEmpty({ message: '스텝 이름을 반드시 입력해야 합니다.' })
    name: string;
}
export class UpdateStepResponseDto {
    @ApiProperty({ example: 1, description: '수정된 Step ID' })
    stepId: number;

    @ApiProperty({ example: '기획 단계', description: '수정된 Step의 이름' })
    name: string;

    static fromEntity(dto: UpdateStepDto, stepId: number): UpdateStepResponseDto {
        const responseDto = new UpdateStepResponseDto();
        responseDto.stepId = stepId;
        responseDto.name = dto.name;
        return responseDto;
    }
}
