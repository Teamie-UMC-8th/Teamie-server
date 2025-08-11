import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PortfolioCorrectionStatus } from 'src/common/enums/portfolio-correction-status.enum';

export class StatusResponseDto {
    @ApiProperty({
        enum: PortfolioCorrectionStatus,
        example: PortfolioCorrectionStatus.NOT_STARTED,
    })
    @IsEnum(PortfolioCorrectionStatus)
    status: PortfolioCorrectionStatus;

    static fromEntity(entity: any): StatusResponseDto {
        const dto = new StatusResponseDto();
        dto.status = entity.status;
        return dto;
    }
}
