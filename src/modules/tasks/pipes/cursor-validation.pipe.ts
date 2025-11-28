import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { plainToInstance, Type } from 'class-transformer';
import { IsISO8601, IsNotEmpty, IsString, validate } from 'class-validator';
import { CursorUtil } from 'src/common/utils/serialize-cursor.util';

export class CursorDto {
    @Type(() => String)
    @IsISO8601()
    @IsString()
    deadline: string;

    @Type(() => String)
    @IsISO8601()
    @IsString()
    @IsNotEmpty()
    createdAt: string;
}

@Injectable()
export class CursorValidationPipe
    implements PipeTransform<string | undefined, Promise<CursorDto | undefined>>
{
    async transform(value: string | undefined): Promise<CursorDto | undefined> {
        // 커서가 없으면 그대로 통과
        if (!value) {
            return undefined;
        }
        // 1. Cursor Decode
        const decoded: object = CursorUtil.decode<CursorDto>(value);

        // 2. DTO 클래스로 변환 및 유효성 검증
        const cursorObject = plainToInstance(CursorDto, decoded, {
            enableImplicitConversion: true,
        });
        const errors = await validate(cursorObject);

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }

        return cursorObject;
    }
}
