import { Controller, Get, Param } from '@nestjs/common';
import { PersonalRecallsService } from './personalRecalls.service';
import { User } from 'src/common/decorators/user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('PersonalRecalls')
@ApiBearerAuth('access-token')
@Controller('/projects')
export class PersonalRecallsController {
  constructor(
    private readonly personalRecallsService: PersonalRecallsService,
  ) {}
  @Get(":projectId/personalRecalls") // 개인 회고 조회
  async getPersonalRecalls(
    @Param('projectId') projectId: string,
    @User('id') userId: number
  ) {
    return await this.personalRecallsService.getPersonalRecalls(userId, +projectId);
  }
}
