import { IsEnum, IsInt } from 'class-validator';
import { Socket } from 'socket.io';
import { SubEventType } from 'src/common/enums/sub-event-type.enum';

export class SubscribePayloadDto {
    @IsEnum(SubEventType)
    eventType: SubEventType;

    @IsInt()
    id: number;

    static from(data: { eventType: SubEventType; id: number }) {
        const dto = new SubscribePayloadDto();
        dto.eventType = data.eventType;
        dto.id = data.id;
        return dto;
    }
}

export class ValidatePayloadDto {
    payload: SubscribePayloadDto;
    client: Socket;

    static from(data: { payload: SubscribePayloadDto; client: Socket }) {
        const dto = new ValidatePayloadDto();
        dto.payload = data.payload;
        dto.client = data.client;
        return dto;
    }
}
