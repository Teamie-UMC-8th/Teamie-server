import { ApiProperty } from '@nestjs/swagger';
import { UserProject } from 'src/modules/projects/user-projects/entities/user-projects.entity';

export class UserWithTasksDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    school: string;

    @ApiProperty({ nullable: true })
    imageUrl: string | null;

    @ApiProperty()
    permission: string;

    @ApiProperty()
    role: string;

    @ApiProperty({
        type: [Object],
        description: '담당 업무 리스트 (추후 구현)',
    })
    tasks: any[];

    static fromEntity(userProject: UserProject): UserWithTasksDto {
        const dto = new UserWithTasksDto();
        const user = userProject.user;

        dto.id = user.id;
        dto.name = user.name;
        dto.email = user.email;
        dto.school = user.school;
        dto.imageUrl = user.imageUrl;
        dto.permission = userProject.permission;
        dto.role = userProject.role;
        dto.tasks = []; // Task 구현 전, 빈 배열로 반환

        return dto;
    }
}
