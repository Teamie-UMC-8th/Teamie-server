import { ApiProperty } from '@nestjs/swagger';
export class ProjectMemberResponseDto {
    @ApiProperty({ description: '사용자 ID' })
    userId: number;

    @ApiProperty({ description: '사용자 이름' })
    name: string;

    constructor(userId: number, name: string) {
        this.userId = userId;
        this.name = name;
    }

    static from(user: { id: number; name: string }): ProjectMemberResponseDto {
        return new ProjectMemberResponseDto(user.id, user.name);
    }
}