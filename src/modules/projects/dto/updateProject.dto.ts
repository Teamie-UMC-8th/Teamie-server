import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: '새로운 프로젝트 이름' })
  name?: string;

  @ApiPropertyOptional({ example: '우리 팀의 규칙입니다.' })
  rule?: string;

  @ApiPropertyOptional({ example: '팀의 목표입니다.' })
  goal?: string;
}