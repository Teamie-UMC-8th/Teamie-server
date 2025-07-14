import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../entities/projects.entity';
import { UserProject } from 'src/modules/mappings/userProjects/userProjects.entity';

export class ProjectDto{
  @ApiProperty({ example: 1, description: '프로젝트 ID' })
  id: number;

  @ApiProperty({ example: '우리 팀 프로젝트', description: '프로젝트 이름' })
  name: string;

  @ApiProperty({ example: '우리 팀의 규칙입니다.', description: '프로젝트 규칙' })
  rule: string;

  @ApiProperty({ example: '팀의 목표입니다.', description: '프로젝트 목표' })
  goal: string;

  static fromEntity(entity: Project): ProjectDto {
    const dto = new ProjectDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.rule = entity.rule;
    dto.goal = entity.goal;
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
    dto.tasks = user.managers?.map(m => SimpleTaskDto.from(m.task.name)) ?? [];
    return dto;
  }
}


export class PostDto {
  @ApiProperty()
  author: string;

  @ApiProperty()
  content: string;

  static from(data: any): PostDto {
    const dto = new PostDto();
    dto.author = data.author;
    dto.content = data.content;
    return dto;
  }
}

export class AllProjectResponseDto {
  @ApiProperty({ type: ProjectDto })
  project: ProjectDto;

  @ApiProperty({ type: [UserInProjectDto] })
  users: UserInProjectDto[];

  @ApiProperty({ type: [PostDto] })
  posts: PostDto[];

  static fromEntity(entity: {
    project: Project;
    users: UserInProjectDto[];
    posts: PostDto[];
  }): AllProjectResponseDto {
    const dto = new AllProjectResponseDto();
    dto.project = ProjectDto.fromEntity(entity.project);
    dto.users = entity.users;
    dto.posts = entity.posts;
    return dto;
  }
}