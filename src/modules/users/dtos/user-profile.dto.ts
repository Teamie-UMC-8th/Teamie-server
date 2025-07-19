import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
    @ApiProperty({
        example: 'https://s3:example.com/profile/example.png',
        description: '사용자 프로필 이미지 url',
    })
    imageUrl: string;

    @ApiProperty({
        example: '홍길동',
        description: '나의 프로필-이름',
    })
    name: string;

    @ApiProperty({
        example: '중앙대학교',
        description: '나의 프로필-학교',
    })
    school: string | null;

    @ApiProperty({
        example: '소프트웨어학부',
        description: '나의 프로필-전공',
    })
    major: string | null;

    @ApiProperty({
        example: 'example@gmail.com',
        description: '나의 프로필-이메일',
    })
    email: string;

    @ApiProperty({
        example: 4,
        description: '사용자의 팀프로젝트 진행 횟수',
    })
    projectNum: number;

    static fromEntity(entity: {
        imageUrl: string;
        name: string;
        school: string;
        major: string;
        email: string;
        projectNum: number;
    }): UserProfileResponseDto {
        const dto = new UserProfileResponseDto();
        dto.imageUrl = entity.imageUrl;
        dto.name = entity.name;
        dto.school = entity.school;
        dto.major = entity.major;
        dto.email = entity.email;
        dto.projectNum = entity.projectNum;
        return dto;
    }
}
