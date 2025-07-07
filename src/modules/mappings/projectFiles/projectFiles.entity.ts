import { BaseEntity } from "src/common/entities/base.entity";
import { FileType } from "src/common/enums/fileType.enum";
import { Project } from "src/modules/projects/projects.entity";
import { User } from "src/modules/users/users.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class ProjectFile extends BaseEntity{
    @Column({ length: 30 })
    name: string;

    @Column({ length: 255 })
    fileUrl: string;

    @Column({
        type: 'enum',
        enum: FileType,
        default: FileType.WORK,
    })
    category: FileType;

    @ManyToOne(() => User, (user) => user.projectFiles, {onDelete: 'CASCADE'})
    user: User;

    @ManyToOne(() => Project, (project) => project.projectFiles, {onDelete: 'CASCADE'})
    project: Project;
}