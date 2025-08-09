import { RealTimeType } from '../response/real-time-response.dto';

export class EventPayloadDto {
    type: RealTimeType;
    data: any;

    static from(type: RealTimeType, data: any) {
        const dto = new EventPayloadDto();
        dto.type = type;
        dto.data = data;
        return dto;
    }
}
