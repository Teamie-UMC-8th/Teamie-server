import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../entities/projects.entity';
import { UserProject } from 'src/modules/projects/entities/userProjects.entity';
import { ProjectSummaryResponseDto } from './project-response.dto';
import { MaxLength , IsString} from 'class-validator';
import { Type } from 'class-transformer';
export class PostDto {
    @ApiProperty()
    @Type(() => Number)
    author: number;

    @ApiProperty()
    @IsString()
    @MaxLength(32)
    content: string;

    static from(data: any): PostDto {
        const dto = new PostDto();
        dto.author = data.author;
        dto.content = data.content;
        return dto;
    }
}

export class SimpleTaskDto {
    @ApiProperty({ example: '담당업무' })
    taskName: string;

    static from(name: string): SimpleTaskDto {
        const dto = new SimpleTaskDto();
        dto.taskName = name;
        return dto;
    }
}

export class UserInProjectDto {
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

    @ApiProperty({ type: [SimpleTaskDto] })
    tasks: SimpleTaskDto[];

    @ApiProperty({ example: 'LEAD' })
    permission: string;

    @ApiProperty({ example: '기획' })
    role: string;
    static from(entity: UserProject): UserInProjectDto {
        const dto = new UserInProjectDto();
        const user = entity.user;

        dto.id = user.id;
        dto.name = user.name;
        dto.email = user.email;
        dto.school = user.school;
        dto.imageUrl = user.imageUrl;
        dto.permission = entity.permission;
        dto.role = entity.role;
        dto.tasks = user.managers?.map((m) => SimpleTaskDto.from(m.task.name)) ?? [];
        return dto;
    }
}

export class AllProjectResponseDto {
    @ApiProperty({ type: ProjectSummaryResponseDto })
    project: ProjectSummaryResponseDto;

    @ApiProperty({ type: [PostDto] })
    posts: PostDto[];

    static fromEntity(entity: { project: Project; posts: PostDto[] }): AllProjectResponseDto {
        const dto = new AllProjectResponseDto();
        dto.project = ProjectSummaryResponseDto.fromEntity(entity.project);
        dto.posts = entity.posts;
        return dto;
    }
}
