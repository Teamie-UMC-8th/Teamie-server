import { Controller, Post, Get, Body, Param, Req, NotFoundException, Query, All } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, CreateProjectResponseDto } from './dto/create-project.dto';
import { AllProjectResponseDto } from './dto/all-project-response.dto';
import { ApiBody, ApiQuery } from '@nestjs/swagger';
import { ApiCommonResponse, ApiCommonErrorResponse } from '../../common/response/swagger-responce.helper';
import { ConfigService } from '@nestjs/config';

@Controller('/projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly configService: ConfigService
  ) {}

  @Post()
  @ApiBody({ type: CreateProjectDto })
  @ApiCommonResponse(CreateProjectResponseDto)
  @ApiCommonErrorResponse('UNAUTHORIZED_USER', '인증되지 않은 사용자입니다.')   //추후에 실제 구현 필요
  async createProject(
    @Body() dto: CreateProjectDto
    //@ReqUser() user: UserPayload,  // 여기서 user.id를 사용
  ) {
    const userId = parseInt(process.env.DEFAULT_USER_ID || '1', 10);
    if (!userId) {
      throw new NotFoundException('인증되지 않은 사용자입니다.');}
    return await this.projectsService.createProject(dto, userId);
  }

  @Get('/join')
  @ApiQuery({ name: 'inviteCode', required: true, example: 'abcd1234' })
  @ApiCommonResponse(AllProjectResponseDto)
  @ApiCommonErrorResponse('NOT_FOUND', '유효하지 않은 초대코드입니다.')
  async joinProject(@Query('inviteCode') inviteCode: string) {
    const userId = parseInt(this.configService.get('DEFAULT_USER_ID') || '1', 10);

  const project = await this.projectsService.getProjectByInviteCode(inviteCode);
  if (!project) throw new NotFoundException('유효하지 않은 초대코드입니다.');

  const projectId = project.id;
  const alreadyJoined = await this.projectsService.isUserInProject(userId, projectId);
  if (!alreadyJoined) {
    await this.projectsService.addUserToProject(userId, projectId, 'member');
  }

  return await this.projectsService.getProjectFullData(projectId);
}

  @Get('/:projectId')
  @ApiCommonResponse(AllProjectResponseDto)
  @ApiCommonErrorResponse('NOT_FOUND', '프로젝트를 찾을 수 없습니다.')
  async getProjectFullData(@Param('projectId') projectId: number) {
  if (!projectId) {
    throw new NotFoundException('프로젝트를 찾을 수 없습니다.');}
    
    return await this.projectsService.getProjectFullData(projectId);
  }

}
