import {
    Body,
    Controller,
    Get,
    Patch,
    Req,
    UploadedFile,
    UseInterceptors,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import { UsersService } from './users.service';
import {
    UpdateProfileRequestDto,
    UpdateProfileRequestWithFileDto,
    UserProfileResponseDto,
} from './dtos/user-profile.dto';
import { ApiCommonResponse } from 'src/common/response/swagger-response.helper';
import { Transactional, TransactionalRequest } from 'src/common/decorators/transaction.decorator';
import { BadRequestException } from 'src/common/exceptions/custom.errors';
import { FileInterceptor } from '@nestjs/platform-express';

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

    @ApiOperation({
        summary: '마이페이지/사용자 프로필 수정 API',
        description: '사용자의 프로필(프로필 이미지, 학교, 전공)을 수정하는 API입니다.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UpdateProfileRequestWithFileDto })
    @ApiCommonResponse(UserProfileResponseDto)
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    @UseInterceptors(FileInterceptor('file'))
    @Transactional()
    @Patch('/me')
    async updateUserProfile(
        @Req() req: TransactionalRequest,
        @User('id') userId: number,
        @Body() body?: UpdateProfileRequestDto,
        @UploadedFile() file?: Express.Multer.File
    ) {
        return await this.userService.updateUserProfile(req.queryRunner, userId, body, file);
    }
}
