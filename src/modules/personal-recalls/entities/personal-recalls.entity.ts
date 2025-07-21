import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { Project } from '../../projects/entities/projects.entity';

@Entity()
export class PersonalRecall extends BaseEntity {
    @Column({ length: 2000, nullable: true })
    collaborationProfile: string;

    @Column({ length: 2000, nullable: true })
    memorableExperience: string;

    @Column({ length: 2000, nullable: true })
    strengthsAndGrowth: string;

    @ManyToOne(() => User, (user) => user.personalRecalls, {
        onDelete: 'CASCADE',
    })
    user: User;

    @ManyToOne(() => Project, (project) => project.personalRecalls, {
        onDelete: 'CASCADE',
    })
    project: Project;
}
