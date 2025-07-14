import { Controller, Post, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, CreateProjectResponseDto } from './dto/create-project.dto';
import { AllProjectResponseDto } from './dto/all-project-response.dto';
import { ApiBearerAuth, ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiCommonResponse, ApiCommonErrorResponse } from '../../common/response/swagger-responce.helper';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User } from 'src/common/decorators/user.decorator';
import { InvalidInvitecodeException, ProjectForbiddenException, ProjectUpdateForbiddenException } from 'src/common/exceptions/custom.errors';

@ApiTags('Projects')
@ApiBearerAuth('access-token')
@Controller('/projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
  ) {}

  @Post()
  @ApiBody({ type: CreateProjectDto })
  @ApiCommonResponse(CreateProjectResponseDto)
  @ApiCommonErrorResponse('UNAUTHORIZED_USER', '인증되지 않은 사용자입니다.')   //추후에 실제 구현 필요
  async createProject(
    @Body() dto: CreateProjectDto,
    @User('id') userId: number,
  ) {
    return await this.projectsService.createProject(dto, userId);
  }

  @Get('/join')
  @ApiQuery({ name: 'inviteCode', required: true, example: 'abcd1234' })
  @ApiCommonResponse(AllProjectResponseDto)
  @ApiCommonErrorResponse('NOT_FOUND', '유효하지 않은 초대코드입니다.',404)
  async joinProject(
    @Query('inviteCode') inviteCode: string,
    @User('id') userId: number,
  ) {
    const project = await this.projectsService.getProjectByInviteCode(inviteCode);
    if (!project) throw new InvalidInvitecodeException();

    const projectId = project.id;
    const alreadyJoined = await this.projectsService.isUserInProject(userId, projectId);
    if (!alreadyJoined) {
      await this.projectsService.addUserToProject(userId, projectId, 'member');
    }

    return await this.projectsService.getProjectFullData(projectId);
  }

  @Get('/:projectId')
  @ApiCommonResponse(AllProjectResponseDto)
  @ApiCommonErrorResponse('NOT_FOUND', '프로젝트를 찾을 수 없습니다.',404)
  @ApiCommonErrorResponse('FORBIDDEN', '해당 프로젝트에 접근 권한이 없습니다.',403)
  async getProjectFullData(
    @Param('projectId') projectId: number,
    @User('id') userId: number,
  ) {
    const isMember = await this.projectsService.checkProjectMembership(userId, projectId);
    if (!isMember) {
      throw new ProjectForbiddenException();
    }

    return await this.projectsService.getProjectFullData(projectId);
  }

  @Patch('/:projectId')
  @ApiBody({ type: UpdateProjectDto })
  @ApiCommonResponse(AllProjectResponseDto)
  @ApiCommonErrorResponse('NOT_FOUND', '프로젝트를 찾을 수 없습니다.', 404)
  @ApiCommonErrorResponse('FORBIDDEN', '해당 항목을 수정할 권한이 없습니다.', 403)
  async updateProject(
    @Param('projectId') projectId: number,
    @Body() dto: UpdateProjectDto,
    @User('id') userId: number,
  ) {
    const isMember = await this.projectsService.checkProjectMembership(userId, projectId);
    if (!isMember) {
      throw new ProjectForbiddenException();
    }

    const isLead = await this.projectsService.checkProjectLeader(userId, projectId);

    // rule, goal은 팀장만 수정 가능
    if (
      (!isLead && dto.rule !== undefined) ||
      (!isLead && dto.goal !== undefined)
    ) {
      throw new ProjectUpdateForbiddenException();
    }

    return await this.projectsService.updateProject(projectId, dto);

  }


}
