import { Body, Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { PersonalRecallsService } from './services/personal-recalls.service';
import { User } from 'src/common/decorators/user.decorator';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UpdatePersonalRecallDto } from './dtos/update-personal-recall.dto';
import {
    ApiCommonErrorResponse,
    ApiCommonResponse,
} from 'src/common/response/swagger-response.helper';
import { PersonalRecallResponseDto } from './dtos/personal-recall-response.dto';

@ApiTags('PersonalRecalls')
@Controller('/projects')
export class PersonalRecallsController {
    constructor(private readonly personalRecallsService: PersonalRecallsService) {}
    @ApiParam({ name: 'projectId', type: Number, description: '프로젝트 ID' })
    @ApiCommonResponse(PersonalRecallResponseDto)
    @ApiCommonErrorResponse('PERSONAL_RECALL_NOT_FOUND', '개인 회고를 찾을 수 없습니다.', 404)
    @ApiOperation({
        summary: '개인 회고 조회',
        description: '프로젝트에 대한 개인 회고를 조회합니다.',
    })
    @Get(':projectId/personal-recalls') // 개인 회고 조회
    async getPersonalRecalls(
        @Param('projectId', ParseIntPipe) projectId: number,
        @User('id') userId: number
    ) {
        return await this.personalRecallsService.getPersonalRecalls(userId, projectId);
    }

    @ApiParam({ name: 'projectId', type: Number, description: '프로젝트 ID' })
    @ApiBody({ type: UpdatePersonalRecallDto })
    @ApiCommonErrorResponse('PERSONAL_RECALL_NOT_FOUND', '개인 회고를 찾을 수 없습니다.', 404)
    @ApiOperation({
        summary: '개인 회고 수정',
        description: '프로젝트에 대한 개인 회고를 수정합니다.',
    })
    @Patch(':projectId/personal-recalls') // 개인 회고 수정
    async updatePersonalRecalls(
        @Param('projectId', ParseIntPipe) projectId: number,
        @User('id') userId: number,
        @Body() updateDataDto: UpdatePersonalRecallDto
    ) {
        return await this.personalRecallsService.updatePersonalRecalls(
            userId,
            projectId,
            updateDataDto
        );
    }
}
