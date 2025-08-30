import {
    Controller,
    Post,
    Get,
    Patch,
    Body,
    Query,
    Delete,
    Param,
    ParseIntPipe,
    Req,
    ValidationPipe,
    UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './services/projects.service';
import { CreateProjectDto, CreateProjectResponseDto } from './dtos/create-project.dto';
import { AllProjectResponseDto } from './dtos/all-project-response.dto';
import { ApiBody, ApiTags, ApiParam, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import {
    ApiCommonResponse,
    ApiCommonErrorResponse,
    ApiCommonResponseArray,
} from '../../common/response/swagger-response.helper';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { User } from 'src/common/decorators/user.decorator';
import { CompleteProjectResponseDto } from './dtos/complete-project.dto';
import { CreateStepDto, CreateStepResponseDto } from '../steps/dtos/create-step.dto';
import { CreatePostDto, CreatePostResponseDto } from './dtos/create-post.dto';
import { DeletePostResponseDto } from './dtos/delete-post-response.dto';
import { ChangeLeaderDto, ChangeLeaderResponseDto } from './dtos/change-leader.dto';
import { UpdateProfileDto, UpdateProfileResponseDto } from './dtos/update-profile.dto';
import { Transactional, TransactionalRequest } from 'src/common/decorators/transaction.decorator';
import { ValidateInviteResponseDto } from './dtos/validate-invite.dto';
import { JoinProjectDto, JoinProjectResponseDto } from './dtos/join-project.dto';
import { CreatePlanReq, CreatePlanResponse } from '../plans/dtos/create-plan.dto';
import { PlansService } from '../plans/services/plans.service';
import { TeamCalenderResponseDto } from './dtos/team-calender-response.dto';
import { CalenderQueryDto } from 'src/common/dtos/calender-date-query.dto';
import { UserProfile } from '../../common/dtos/user-profile.dto';
import { ProjectMemberGuard } from './guards/project-member.guard';
import { ErrorCode } from 'src/common/exceptions/errorcode.enum';
import { HttpStatus } from '@nestjs/common';
import { PermissionResponseDto } from './dtos/get-permission.dto';
import { ApiCommonErrorResponses } from 'src/common/decorators/api-common-error-responses.decorator';
import { getProjectIsCompleted } from './dtos/get-project-isCompleted.dto';
@ApiTags('Projects')
@Controller('/projects')
export class ProjectsController {
    constructor(
        private readonly projectsService: ProjectsService,
        private readonly plansService: PlansService
    ) {}

    @ApiOperation({ summary: '프로젝트 생성', description: '새로운 프로젝트를 생성합니다.' })
    @ApiCommonResponse(CreateProjectResponseDto)
    @ApiCommonErrorResponses(HttpStatus.UNAUTHORIZED, [
        { errorCode: ErrorCode.UNAUTHORIZED, reason: '인증되지 않은 사용자입니다.' },
    ])
    @Transactional()
    @Post()
    async createProject(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Body() dto: CreateProjectDto
    ) {
        return await this.projectsService.createProject(req.queryRunner, dto, userId);
    }

    @ApiOperation({
        summary: '초대코드 유효성 검사',
        description: 'inviteCode가 유효한지 확인합니다.',
    })
    @ApiCommonResponse(ValidateInviteResponseDto)
    @ApiCommonErrorResponses(HttpStatus.BAD_REQUEST, [
        { errorCode: ErrorCode.INVALID_INVITE_CODE, reason: '유효하지 않은 초대코드입니다.' },
    ])
    @ApiCommonErrorResponses(HttpStatus.FORBIDDEN, [
        { errorCode: ErrorCode.PROJECT_ALREADY_COMPLETED, reason: '이미 완료된 프로젝트입니다' },
        { errorCode: ErrorCode.EXPIRED_INVITE_CODE, reason: '유효기간이 지난 url입니다.' },
        { errorCode: ErrorCode.ALREDY_JOIN, reason: '이미 프로젝트에 참여하였습니다.' },
    ])
    @Get('/join/validate')
    async validateInvite(@User('id') userId: number, @Query('inviteCode') inviteCode: string) {
        return await this.projectsService.joinValidate(userId, inviteCode);
    }

    @ApiOperation({ summary: '프로젝트 참여', description: '초대 코드로 프로젝트에 참여합니다.' })
    @ApiCommonResponse(JoinProjectResponseDto)
    @Transactional()
    @Post('/join')
    async joinProject(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Body() dto: JoinProjectDto
    ) {
        return await this.projectsService.joinProject(req.queryRunner, userId, dto);
    }

    @ApiOperation({
        summary: '프로젝트 상세 조회',
        description: '프로젝트의 상세 정보를 조회합니다.',
    })
    @ApiParam({ name: 'projectId', type: Number, description: '프로젝트 ID' })
    @ApiCommonResponse(AllProjectResponseDto)
    @ApiCommonErrorResponses(HttpStatus.NOT_FOUND, [
        { errorCode: ErrorCode.PROJECT_NOT_FOUND, reason: '프로젝트를 찾을 수 없습니다.' },
    ])
    @ApiCommonErrorResponses(HttpStatus.FORBIDDEN, [
        {
            errorCode: ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
            reason: '해당 프로젝트에 접근 권한이 없습니다.',
        },
    ])
    @UseGuards(ProjectMemberGuard)
    @Get('/:projectId')
    async getProjectFullData(@Param('projectId', ParseIntPipe) projectId: number) {
        return await this.projectsService.getProjectFullData(projectId);
    }

    @ApiOperation({ summary: '프로젝트 수정', description: '프로젝트의 정보를 수정합니다.' })
    @ApiParam({ name: 'projectId', type: Number, description: '프로젝트 ID' })
    @ApiCommonResponse(AllProjectResponseDto)
    @ApiCommonErrorResponses(HttpStatus.FORBIDDEN, [
        { errorCode: ErrorCode.PROJECT_NOT_FOUND, reason: '프로젝트를 찾을 수 없습니다.' },
        {
            errorCode: ErrorCode.FORBIDDEN_USER_FOR_UPDATE,
            reason: '해당 항목을 수정할 권한이 없습니다.',
        },
    ])
    @UseGuards(ProjectMemberGuard)
    @Transactional()
    @Patch('/:projectId')
    async updateProject(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('projectId', ParseIntPipe) projectId: number,
        @Body() dto: UpdateProjectDto
    ) {
        return await this.projectsService.updateProject(req.queryRunner, userId, projectId, dto);
    }

    @ApiOperation({ summary: '프로젝트 완료', description: '프로젝트를 완료합니다.' })
    @ApiParam({ name: 'projectId', type: Number, description: '프로젝트 ID' })
    @ApiCommonResponse(CompleteProjectResponseDto)
    @ApiCommonErrorResponses(HttpStatus.FORBIDDEN, [
        { errorCode: ErrorCode.PROJECT_NOT_FOUND, reason: '프로젝트를 찾을 수 없습니다.' },
        {
            errorCode: ErrorCode.FORBIDDEN_USER_FOR_UPDATE,
            reason: '프로젝트는 팀장만 완료할 수 있습니다.',
        },
    ])
    @UseGuards(ProjectMemberGuard)
    @Transactional()
    @Patch(':projectId/complete')
    async completeProject(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('projectId', ParseIntPipe) projectId: number
    ) {
        return await this.projectsService.completeProject(req.queryRunner, userId, projectId);
    }

    @ApiOperation({
        summary: '프로젝트 step 생성',
        description: '프로젝트에 새로운 step을 추가합니다.',
    })
    @ApiParam({ name: 'projectId', type: Number, description: '프로젝트 ID' })
    @ApiCommonResponse(CreateStepResponseDto)
    @ApiCommonErrorResponses(HttpStatus.FORBIDDEN, [
        { errorCode: ErrorCode.PROJECT_NOT_FOUND, reason: '프로젝트를 찾을 수 없습니다.' },
    ])
    @UseGuards(ProjectMemberGuard)
    @Transactional()
    @Post(':projectId/steps')
    async createStep(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('projectId', ParseIntPipe) projectId: number,
        @Body() dto: CreateStepDto
    ) {
        return await this.projectsService.createStep(req.queryRunner, dto, projectId, userId);
    }

    @ApiOperation({
        summary: '게시글 포스트잇 생성',
        description: '게시판에 새로운 포스트잇을 추가합니다.',
    })
    @ApiParam({ name: 'projectId', type: Number })
    @ApiCommonResponse(CreatePostResponseDto)
    @ApiCommonErrorResponses(HttpStatus.FORBIDDEN, [
        { errorCode: ErrorCode.PROJECT_NOT_FOUND, reason: '프로젝트를 찾을 수 없습니다.' },
        { errorCode: ErrorCode.POSTS_EXCEEDED, reason: '포스트잇은 16개까지 생성될 수 있습니다.' },
    ])
    @UseGuards(ProjectMemberGuard)
    @Post(':projectId/posts')
    async createPost(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('projectId', ParseIntPipe) projectId: number,
        @Body() dto: CreatePostDto
    ) {
        return await this.projectsService.createPost(dto, userId, projectId);
    }

    @ApiOperation({
        summary: '게시글 포스트잇 삭제',
        description: '게시판에서 포스트잇을 삭제합니다.',
    })
    @ApiParam({ name: 'projectId', type: Number })
    @ApiParam({ name: 'postId', type: Number })
    @ApiCommonResponse(DeletePostResponseDto)
    @ApiCommonErrorResponses(HttpStatus.FORBIDDEN, [
        { errorCode: ErrorCode.PROJECT_NOT_FOUND, reason: '프로젝트를 찾을 수 없습니다.' },
        { errorCode: ErrorCode.POST_NOT_FOUND, reason: '포스트잇을 찾을 수 없습니다.' },
        { errorCode: ErrorCode.NOT_POST_AUTHOR, reason: '포스트잇 작성자만 삭제할 수 있습니다.' },
        {
            errorCode: ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
            reason: '해당 프로젝트에 접근 권한이 없습니다.',
        },
    ])
    @UseGuards(ProjectMemberGuard)
    @Delete(':projectId/posts/:postId')
    async deletePost(
        @User('id') userId: number,
        @Param('projectId', ParseIntPipe) projectId: number,
        @Param('postId', ParseIntPipe) postId: number
    ) {
        return await this.projectsService.deletePost(postId, userId, projectId);
    }

    @ApiOperation({
        summary: '프로젝트 팀장 변경',
        description: '프로젝트의 팀장을 변경합니다.',
    })
    @ApiParam({ name: 'projectId', type: Number, description: '프로젝트 ID' })
    @ApiCommonResponse(ChangeLeaderResponseDto)
    @ApiCommonErrorResponses(HttpStatus.FORBIDDEN, [
        { errorCode: ErrorCode.PROJECT_NOT_FOUND, reason: '프로젝트를 찾을 수 없습니다.' },
        {
            errorCode: ErrorCode.FORBIDDEN_SELF_ASSIGN,
            reason: '자기 자신을 팀장으로 지목할 수 없습니다.',
        },
        {
            errorCode: ErrorCode.ASSIGNEE_NOT_MEMBER,
            reason: '해당 사람은 프로젝트 멤버가 아닙니다.',
        },
        { errorCode: ErrorCode.ALREDY_LEADER, reason: '이미 팀장인 사용자입니다.' },
    ])
    @UseGuards(ProjectMemberGuard)
    @Transactional()
    @Patch(':projectId/leader')
    async changeProjectLeader(
        @Req() req: TransactionalRequest,
        @User('id') currentUserId: number,
        @Param('projectId', ParseIntPipe) projectId: number,
        @Body() dto: ChangeLeaderDto
    ) {
        return await this.projectsService.changeProjectLeader(
            req.queryRunner,
            projectId,
            dto,
            currentUserId
        );
    }

    @ApiOperation({
        summary: '프로필 카드 수정',
        description: '프로필 카드를 수정합니다.',
    })
    @ApiParam({ name: 'projectId', type: Number, description: '프로젝트 ID' })
    @ApiCommonResponse(UpdateProfileResponseDto)
    @ApiCommonErrorResponses(HttpStatus.FORBIDDEN, [
        { errorCode: ErrorCode.NOT_YOUR_PROFILE, reason: '자신의 프로필만 수정할 수 있습니다.' },
        { errorCode: ErrorCode.PROJECT_NOT_FOUND, reason: '프로젝트를 찾을 수 없습니다.' },
    ])
    @UseGuards(ProjectMemberGuard)
    @Transactional()
    @Patch('/:projectId/profile')
    async changeProfile(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('projectId', ParseIntPipe) projectId: number,
        @Body() dto: UpdateProfileDto
    ) {
        return await this.projectsService.updateProfile(req.queryRunner, projectId, userId, dto);
    }

    @ApiOperation({
        summary: '팀 캘린더 조회',
        description:
            '프로젝트 별 팀 캘린더를 조회하는 API, 캘린더의 시작 날짜와 마지막 날짜를 입력해주세요.',
    })
    @ApiCommonResponseArray(TeamCalenderResponseDto)
    @ApiCommonErrorResponse(
        ErrorCode.PLAN_DATE_TOO_LONG,
        '최대 45일까지만 조회할 수 있습니다.',
        HttpStatus.BAD_REQUEST
    )
    @ApiCommonErrorResponse(
        ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
        '해당 프로젝트에 접근 권한이 없습니다.',
        HttpStatus.FORBIDDEN
    )
    @UseGuards(ProjectMemberGuard)
    @Get('/:projectId/plans')
    async getTeamCalender(
        @Param('projectId', ParseIntPipe) projectId: number,
        @Query(new ValidationPipe({ transform: true })) query: CalenderQueryDto
    ) {
        const startDate = query.startDate;
        const endDate = query.endDate;
        return await this.projectsService.getTeamCalender(projectId, startDate, endDate);
    }

    @ApiOperation({
        summary: '일정 생성',
        description:
            '팀 캘린더에서 새로운 일정을 생성하는 API입니다. 프로젝트 생성 일자 이전에는 일정을 생성할 수 없습니다.',
    })
    @ApiCommonResponse(CreatePlanResponse)
    @ApiCommonErrorResponses(HttpStatus.NOT_FOUND, [
        { errorCode: ErrorCode.PROJECT_NOT_FOUND, reason: '프로젝트를 찾을 수 없습니다.' },
    ])
    @ApiCommonErrorResponses(HttpStatus.FORBIDDEN, [
        {
            errorCode: ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
            reason: '해당 프로젝트에 접근 권한이 없습니다.',
        },
        {
            errorCode: ErrorCode.PLAN_DATE_CONFLICT,
            reason: '프로젝트 생성일자 이전에는 일정 생성이 불가능합니다.',
        },
    ])
    @UseGuards(ProjectMemberGuard)
    @Transactional()
    @Post('/:projectId/plans')
    async createPlan(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Param('projectId', ParseIntPipe) projectId: number,
        @Body() body: CreatePlanReq
    ): Promise<CreatePlanResponse> {
        const date: Date = new Date(body.date);
        return await this.plansService.createPlan(req.queryRunner, projectId, date);
    }

    @ApiOperation({
        summary: '프로젝트 참여자 리스트 조회',
        description: '프로젝트에 참여자 리스트를 조회합니다.',
    })
    @ApiParam({ name: 'projectId', type: Number, description: '프로젝트 ID' })
    @ApiCommonResponseArray(UserProfile)
    @ApiCommonErrorResponse(
        ErrorCode.PROJECT_NOT_FOUND,
        '프로젝트를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND
    )
    @ApiCommonErrorResponse(
        ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
        '해당 프로젝트에 접근 권한이 없습니다.',
        HttpStatus.FORBIDDEN
    )
    @UseGuards(ProjectMemberGuard)
    @Get('/:projectId/members')
    async getProjectMemberList(
        @User('id') userId: number,
        @Param('projectId', ParseIntPipe) projectId: number
    ) {
        return await this.projectsService.getProjectMemberList(projectId);
    }

    @ApiOperation({
        summary: '사용자의 프로젝트 권한 조회',
        description: '사용자의 프로젝트 권한을 조회합니다.',
    })
    @ApiCommonResponse(PermissionResponseDto)
    @ApiCommonErrorResponse(
        ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
        '해당 프로젝트에 접근 권한이 없습니다.',
        HttpStatus.FORBIDDEN
    )
    @Get('/:projectId/my-permission')
    async getUserProjectPermission(
        @User('id') userId: number,
        @Param('projectId', ParseIntPipe) projectId: number
    ) {
        return await this.projectsService.getUserPermissionOfProject(userId, projectId);
    }

    @ApiOperation({
        summary: '프로젝트 종료 여부 조회',
        description: '프로젝트 id를 통해 종료 여부를 조회합니다.',
    })
    @ApiCommonResponse(getProjectIsCompleted)
    @ApiCommonErrorResponse(
        ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
        '해당 프로젝트에 접근 권한이 없습니다.',
        HttpStatus.FORBIDDEN
    )
    @ApiCommonErrorResponse(
        ErrorCode.PROJECT_NOT_FOUND,
        '프로젝트를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND
    )
    //NOTE: 추후 커스텀 가드로 프로젝트 종료 여부 체크
    @UseGuards(ProjectMemberGuard)
    @Get('/:projectId/isCompleted')
    async getProjectIsCompleted(
        @User('id') userId: number,
        @Param('projectId', ParseIntPipe) projectId: number
    ) {
        return await this.projectsService.isCompleted(projectId);
    }
}
