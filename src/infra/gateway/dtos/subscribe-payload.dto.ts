import { IsInt, IsString } from 'class-validator';
import { SubEventType } from 'src/common/enums/sub-event-type.enum';

//NOTE: id에 대한 HttpStatus.FORBIDDEN 체크 validation 추가 필요
export class SubscribePayloadDto {
    @IsString()
    eventType: SubEventType;

    @IsInt()
    id: number;
}
