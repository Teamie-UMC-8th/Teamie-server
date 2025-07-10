import { Controller, Get, Param } from '@nestjs/common';
import { PersonalRecallsService } from './personalRecalls.service';
import { ConfigService } from '@nestjs/config';

@Controller('/projects')
export class PersonalRecallsController {
  constructor(
    private readonly personalRecallsService: PersonalRecallsService,
    private readonly configService: ConfigService,
  ) {}
  @Get(":projectId/personalRecalls") // 개인 회고 조회
  async getPersonalRecalls(@Param('projectId') projectId: string) {
    const userId = parseInt(this.configService.get('DEFAULT_USER_ID') || '1', 10); // 임시로 userId 사용
    return await this.personalRecallsService.getPersonalRecalls(userId, +projectId);
  }
}
