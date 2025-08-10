import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
export class UpdateProjectDto {
  @ApiPropertyOptional({ example: '새로운 프로젝트 이름' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  name?: string;

  @ApiPropertyOptional({ example: '우리 팀의 규칙입니다.' })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  rule?: string;

  @ApiPropertyOptional({ example: '팀의 목표입니다.' })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  goal?: string;
}


