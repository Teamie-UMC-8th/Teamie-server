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
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, CreateProjectResponseDto } from './dtos/create-project.dto';
import { AllProjectResponseDto } from './dtos/all-project-response.dto';
import {
    ApiBearerAuth,
    ApiBody,
    ApiQuery,
    ApiTags,
    ApiParam,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import {
    ApiCommonResponse,
    ApiCommonErrorResponse,
} from '../../common/response/swagger-response.helper';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { User } from 'src/common/decorators/user.decorator';
import { CompleteProjectResponseDto } from './dtos/complete-project.dto';
import { CreateStepDto, CreateStepResponseDto } from '../steps/dtos/create-step.dto';
import { StepsService } from '../steps/steps.service';
import { CreatePostDto, CreatePostResponseDto } from './dtos/create-post.dto';
import { CommonResponse } from 'src/common/response/common-response.dto';
import { DeletePostResponseDto } from './dtos/delete-post-response.dto';
import { ChangeLeaderDto, ChangeLeaderResponseDto } from './dtos/change-leader.dto';
@ApiTags('Projects')
@ApiBearerAuth('access-token')
@Controller('/projects')
export class ProjectsController {
    constructor(
        private readonly projectsService: ProjectsService,
        private readonly stepsService: StepsService
    ) {}

    @Post()
    @ApiBody({ type: CreateProjectDto })
    @ApiOperation({ summary: '프로젝트 생성', description: '새로운 프로젝트를 생성합니다.' })
    @ApiCommonResponse(CreateProjectResponseDto)
    @ApiCommonErrorResponse('UNAUTHORIZED_USER', '인증되지 않은 사용자입니다.') //추후에 실제 구현 필요
    async createProject(@Body() dto: CreateProjectDto, @User('id') userId: number) {
        return await this.projectsService.createProject(dto, userId);
    }

    @Get('/join')
    @ApiOperation({ summary: '프로젝트 참여', description: '초대 코드로 프로젝트에 참여합니다.' })
    @ApiQuery({ name: 'inviteCode', required: true, example: 'abcd1234' })
    @ApiCommonResponse(AllProjectResponseDto)
    @ApiCommonErrorResponse('INVALID_INVITE_CODE', '유효하지 않은 초대코드입니다.', 404)
    async joinProject(@Query('inviteCode') inviteCode: string, @User('id') userId: number) {
        return await this.projectsService.joinProject(userId, inviteCode);
    }

    @Get('/:projectId')
    @ApiOperation({
        summary: '프로젝트 상세 조회',
        description: '프로젝트의 상세 정보를 조회합니다.',
    })
    @ApiParam({ name: 'projectId', type: Number, description: '프로젝트 ID' })
    @ApiCommonResponse(AllProjectResponseDto)
    @ApiCommonErrorResponse('PROJECT_NOT_FOUND', '프로젝트를 찾을 수 없습니다.', 404)
    @ApiCommonErrorResponse(
        'FORBIDDEN_USER_FOR_UPDATE',
        '해당 프로젝트에 접근 권한이 없습니다.',
        403
    )
    async getProjectFullData(
        @Param('projectId', ParseIntPipe) projectId: number,
        @User('id') userId: number
    ) {
        return await this.projectsService.getProjectFullData(userId, projectId);
    }

    @Patch('/:projectId')
    @ApiOperation({ summary: '프로젝트 수정', description: '프로젝트의 정보를 수정합니다.' })
    @ApiParam({ name: 'projectId', type: Number, description: '프로젝트 ID' })
    @ApiBody({ type: UpdateProjectDto })
    @ApiCommonResponse(AllProjectResponseDto)
    @ApiCommonErrorResponse('PROJECT_NOT_FOUND', '프로젝트를 찾을 수 없습니다.', 404)
    @ApiCommonErrorResponse('FORBIDDEN_USER_FOR_UPDATE', '해당 항목을 수정할 권한이 없습니다.', 403)
    async updateProject(
        @Param('projectId', ParseIntPipe) projectId: number,
        @Body() dto: UpdateProjectDto,
        @User('id') userId: number
    ) {
        return await this.projectsService.updateProject(userId, projectId, dto);
    }

    @Patch(':projectId/complete')
    @ApiOperation({ summary: '프로젝트 완료', description: '프로젝트를 완료합니다.' })
    @ApiParam({ name: 'projectId', type: Number, description: '프로젝트 ID' })
    @ApiCommonResponse(CompleteProjectResponseDto)
    @ApiCommonErrorResponse('PROJECT_NOT_FOUND', '프로젝트를 찾을 수 없습니다.', 404)
    @ApiCommonErrorResponse(
        'FORBIDDEN_USER_FOR_UPDATE',
        '프로젝트는 팀장만 완료할 수 있습니다.',
        403
    )
    async completeProject(
        @Param('projectId', ParseIntPipe) projectId: number,
        @User('id') userId: number
    ) {
        return await this.projectsService.completeProject(userId, projectId);
    }

    @Post(':projectId/steps')
    @ApiOperation({
        summary: '프로젝트 step 생성',
        description: '프로젝트에 새로운 step을 추가합니다.',
    })
    @ApiParam({ name: 'projectId', type: Number, description: '프로젝트 ID' })
    @ApiBody({ type: CreateStepDto })
    @ApiCommonResponse(CreateStepResponseDto)
    @ApiCommonErrorResponse('PROJECT_NOT_FOUND', '프로젝트를 찾을 수 없습니다.', 404)
    async createStep(
        @Param('projectId', ParseIntPipe) projectId: number,
        @Body() dto: CreateStepDto,
        @User('id') userId: number
    ) {
        return await this.projectsService.createStep(dto, projectId, userId);
    }

    @Post(':projectId/posts')
    @ApiOperation({
        summary: '게시글 포스트잇 생성',
        description: '게시판에 새로운 포스트잇을 추가합니다.',
    })
    @ApiParam({ name: 'projectId', type: Number })
    @ApiBody({ type: CreatePostDto })
    @ApiCommonResponse(CreatePostResponseDto)
    @ApiCommonErrorResponse('PROJECT_NOT_FOUND', '프로젝트를 찾을 수 없습니다.', 404)
    @ApiCommonErrorResponse('POSTS_EXCEEDED', '포스트잇은 10개까지 생성될 수 있습니다.', 409)
    async createPost(
        @Param('projectId', ParseIntPipe) projectId: number,
        @Body() dto: CreatePostDto,
        @User('id') userId: number
    ) {
        return await this.projectsService.createPost(dto, userId, projectId);
    }

    @Delete(':projectId/posts/:postId')
    @ApiOperation({
        summary: '게시글 포스트잇 삭제',
        description: '게시판에서 포스트잇을 삭제합니다.',
    })
    @ApiParam({ name: 'projectId', type: Number })
    @ApiParam({ name: 'postId', type: Number })
    @ApiCommonResponse(DeletePostResponseDto)
    @ApiCommonErrorResponse('PROJECT_NOT_FOUND', '프로젝트를 찾을 수 없습니다.', 404)
    @ApiCommonErrorResponse('POST_NOT_FOUND', '포스트잇을 찾을 수 없습니다.', 404)
    @ApiCommonErrorResponse('NOT_POST_AUTHOR', '포스트잇 작성자만 삭제할 수 있습니다.', 403)
    @ApiCommonErrorResponse(
        'FORBIDDEN_USER_FOR_PROJECT',
        '해당 프로젝트에 접근 권한이 없습니다.',
        403
    )
    @ApiCommonErrorResponse(
        'REDIS_DATA_PARSE_ERROR',
        'Redis에서 데이터를 파싱하는 중 오류가 발생했습니다.',
        500
    )
    async deletePost(
        @Param('projectId', ParseIntPipe) projectId: number,
        @Param('postId', ParseIntPipe) postId: number,
        @User('id') userId: number
    ) {
        return await this.projectsService.deletePost(postId, userId, projectId);
    }

    @Patch(':projectId/leader')
    @ApiOperation({
        summary: '프로젝트 팀장 변경',
        description: '프로젝트의 팀장을 변경합니다.',
    })
    @ApiParam({ name: 'projectId', type: Number, description: '프로젝트 ID' })
    @ApiBody({ type: ChangeLeaderDto })
    @ApiCommonResponse(ChangeLeaderResponseDto)
    @ApiCommonErrorResponse('PROJECT_NOT_FOUND', '프로젝트를 찾을 수 없습니다.', 404)
    @ApiCommonErrorResponse(
        'FORBIDDEN_SELF_ASSIGN',
        '자기 자신을 팀장으로 지목할 수 없습니다.',
        403
    )
    @ApiCommonErrorResponse('ASIGNEE_NOT_MEMBER', '해당 사람은 프로젝트 멤버가 아닙니다.', 409)
    @ApiCommonErrorResponse('ALREDY_LEADER', '이미 팀장인 사용자입니다.', 409)
    async changeProjectLeader(
        @Param('projectId', ParseIntPipe) projectId: number,
        @Body() dto: ChangeLeaderDto,
        @User('id') currentUserId: number
    ) {
        return await this.projectsService.changeProjectLeader(projectId, dto, currentUserId);
    }
}
