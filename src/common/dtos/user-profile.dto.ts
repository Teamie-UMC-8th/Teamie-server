import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/modules/users/entities/users.entity';

export class UserProfile {
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
