export enum RealTimeType {
    CREATED = 'created',
    UPDATED = 'updated',
    DELETED = 'deleted',
    SYNCED = 'synced',
}

export enum RealTimeEntity {
    TASK = 'task',
    PLAN = 'plan',
    TASK_FILE = 'task_file',
    STEP = 'step',
}

export class RealTimeMessage<T = any> {
    type: RealTimeType; //행동 구분
    entity: RealTimeEntity; //도메인 구분
    payload: T; //상세 데이터
    timestamp: string;
    //그 외 동기화 메타 정보가 추가될 수 있음.

    private constructor(type: RealTimeType, entity: RealTimeEntity, payload: T) {
        this.type = type;
        this.entity = entity;
        this.payload = payload;
        this.timestamp = new Date().toISOString();
    }

    static of<T>(type: RealTimeType, entity: RealTimeEntity, payload: T): RealTimeMessage<T> {
        return new RealTimeMessage(type, entity, payload);
    }
}
