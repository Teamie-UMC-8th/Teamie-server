import { Body, Controller, Get, HttpStatus, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { PersonalRecallsService } from './services/personal-recalls.service';
import { User } from 'src/common/decorators/user.decorator';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UpdatePersonalRecallDto } from './dtos/update-personal-recall.dto';
import {
    ApiCommonErrorResponse,
    ApiCommonResponse,
} from 'src/common/response/swagger-response.helper';
import { PersonalRecallResponseDto } from './dtos/personal-recall-response.dto';
import { ApiCommonErrorResponses } from 'src/common/decorators/api-common-error-responses.decorator';

@ApiTags('PersonalRecalls')
@Controller('/projects')
export class PersonalRecallsController {
    constructor(private readonly personalRecallsService: PersonalRecallsService) {}
    @ApiOperation({
        summary: '개인 회고 조회',
        description: '프로젝트에 대한 개인 회고를 조회합니다.',
    })
    @ApiParam({ name: 'projectId', type: Number, description: '프로젝트 ID' })
    @ApiCommonResponse(PersonalRecallResponseDto)
    @ApiCommonErrorResponses(HttpStatus.NOT_FOUND, {
        errorCode: 'PERSONALRECALL4041',
        reason: '개인 회고를 찾을 수 없습니다.',
    })
    @Get(':projectId/personal-recalls') // 개인 회고 조회
    async getPersonalRecalls(
        @User('id') userId: number,
        @Param('projectId', ParseIntPipe) projectId: number
    ) {
        return await this.personalRecallsService.getPersonalRecalls(userId, projectId);
    }

    @ApiOperation({
        summary: '개인 회고 수정',
        description: '프로젝트에 대한 개인 회고를 수정합니다.',
    })
    @ApiParam({ name: 'projectId', type: Number, description: '프로젝트 ID' })
    @ApiBody({ type: UpdatePersonalRecallDto })
    @ApiCommonErrorResponses(HttpStatus.NOT_FOUND, {
        errorCode: 'PERSONALRECALL4041',
        reason: '개인 회고를 찾을 수 없습니다.',
    })
    @Patch(':projectId/personal-recalls') // 개인 회고 수정
    async updatePersonalRecalls(
        @User('id') userId: number,
        @Param('projectId', ParseIntPipe) projectId: number,
        @Body() updateDataDto: UpdatePersonalRecallDto
    ) {
        return await this.personalRecallsService.updatePersonalRecalls(
            userId,
            projectId,
            updateDataDto
        );
    }
}
