import { Body, Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { PersonalRecallsService } from './personal-recalls.service';
import { User } from 'src/common/decorators/user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UpdatePersonalRecallDto } from './dtos/update-personal-recall.dto';

@ApiTags('PersonalRecalls')
@ApiBearerAuth('access-token')
@Controller('/projects')
export class PersonalRecallsController {
    constructor(private readonly personalRecallsService: PersonalRecallsService) {}
    @Get(':projectId/personalRecalls') // 개인 회고 조회
    async getPersonalRecalls(
        @Param('projectId', ParseIntPipe) projectId: number,
        @User('id') userId: number
    ) {
        return await this.personalRecallsService.getPersonalRecalls(userId, projectId);
    }

    @Patch(':projectId/personalRecalls') // 개인 회고 수정
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
