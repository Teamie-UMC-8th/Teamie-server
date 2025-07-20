import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import { UsersService } from './users.service';
import { UserProfileResponseDto } from './dtos/user-profile.dto';
import { ApiCommonResponse } from 'src/common/response/swagger-response.helper';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) {}

    @Get('/me')
    @ApiOperation({
        summary: '마이페이지/사용자 프로필 조회 API',
        description: '사용자의 프로필을 조회하는 API입니다.',
    })
    @ApiCommonResponse(UserProfileResponseDto)
    async getUserProfile(@User('id') userId: number) {
        return await this.userService.getUserProfile(userId);
    }
}
