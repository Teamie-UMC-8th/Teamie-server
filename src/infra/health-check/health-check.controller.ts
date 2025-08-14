import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Pulbic } from 'src/common/decorators/public.decorator';

@Controller('/health')
export class HealthCheckController {
    @ApiOperation({
        summary: '서버 상태 확인',
        description:
            '로드밸런서가 서버 상태를 확인할 때 사용하는 헬스체크용 API입니다. 로그인 없이도 테스트 가능합니다.',
    })
    @ApiOkResponse({
        schema: {
            example: {
                isSuccess: true,
                error: null,
                result: "I'm Healthy",
            },
        },
    })
    @Pulbic()
    @Get()
    getHello(): string {
        return "I'm Healthy";
    }
}
