import { ApiProperty } from '@nestjs/swagger';

export class getProjectIsCompleted {
    @ApiProperty({ example: false, description: '프로젝트 종료 여부' })
    isCompleted: boolean;
}
