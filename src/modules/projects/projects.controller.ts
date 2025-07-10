import { Controller, Post, Body } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, CreateProjectResponseDto } from './dto/create-project.dto';
import { ApiBody } from '@nestjs/swagger';
import { ApiCommonResponse, ApiCommonErrorResponse } from '../../common/response/swagger-responce.helper';
@Controller('/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiBody({ type: CreateProjectDto })
  @ApiCommonResponse(CreateProjectResponseDto)
  @ApiCommonErrorResponse('UNAUTHORIZED_USER', '인증되지 않은 사용자입니다.')   //추후에 실제 구현 필요
  async createProject(
    @Body() dto: CreateProjectDto
    //@ReqUser() user: UserPayload,  // 여기서 user.id를 사용
  ) {
    const userId = parseInt(process.env.DEFAULT_USER_ID || '1', 10);
    return await this.projectsService.createProject(dto, userId);
  }
}
