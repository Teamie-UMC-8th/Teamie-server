import { Controller, Post, Body } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, CreateProjectResponseDto } from './dto/create-project.dto';
import { ApiBody, ApiCreatedResponse } from '@nestjs/swagger';

@Controller('/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiBody({ type: CreateProjectDto })
  @ApiCreatedResponse({
  description: '프로젝트 생성 성공',
  type: CreateProjectResponseDto,
})
  async createProject(
    @Body() dto: CreateProjectDto
    //@ReqUser() user: UserPayload,  // 여기서 user.id를 사용
  ) {
    const mockUser = 1  // Mock user for testing
    return await this.projectsService.createProject(dto, mockUser);
  }
}
