import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/modules/users/entities/users.entity';
import { Plan } from '../plans.entity';

class UserProfile {
    @ApiProperty({
        example: 123,
        description: '사용자 id',
    })
    userId: number;

    @ApiProperty({
        example: '홍길동',
        description: '사용자 이름',
    })
    name: string;

    @ApiProperty({
        example: 'https://s3:example.com/profile/example.png',
        description: '사용자 프로필 이미지 url',
    })
    imageUrl: string;

    static from(entity: User): UserProfile {
        const dto = new UserProfile();
        dto.userId = entity.id;
        dto.name = entity.name;
        dto.imageUrl = entity.imageUrl;
        return dto;
    }
}

export class PlanDetails {
    @ApiProperty({
        example: '일정 C',
        description: '일정 이름',
    })
    name: string;

    @ApiProperty({
        example: '2025-07-05',
        description: '회의 일자',
    })
    date: string;

    @ApiProperty({
        example: '18:00',
        description: '회의 시작 시간',
    })
    startHour: string;

    @ApiProperty({
        example: '000관 000호',
        description: '회의 장소',
    })
    location: string;

    @ApiProperty({
        description: '참석자 명단',
    })
    attendees: UserProfile[];

    @ApiProperty({
        description: '비고란, 최대 500자',
    })
    memo: string;

    @ApiProperty({
        description: '기록자 명단',
    })
    writers: UserProfile[];

    @ApiProperty({
        description: '회의록, 최대 5000자',
    })
    meetingRecords: string;

    static from(entity: Plan): PlanDetails {
        const dto = new PlanDetails();
        dto.name = entity.name;
        dto.date = entity.date.toISOString();
        dto.startHour = entity.startHour;
        dto.location = entity.location;
        dto.attendees = entity.attendees.map((attendee) => UserProfile.from(attendee.user));
        dto.memo = entity.memo;
        dto.writers = entity.writers.map((writer) => UserProfile.from(writer.user));
        dto.meetingRecords = entity.meetingRecords;
        return dto;
    }
}
