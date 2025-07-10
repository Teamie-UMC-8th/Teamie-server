import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { User } from '../../users/users.entity';
import { Project } from '../../projects/entities/projects.entity';

@Entity()
export class PersonalRecall extends BaseEntity {
  @Column({ length: 5000 })
  q1: string;

  @Column({ length: 5000 })
  q2: string;

  @Column({ length: 5000 })
  q3: string;

  @ManyToOne(() => User, (user) => user.personalRecalls, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Project, (project) => project.personalRecalls, {
    onDelete: 'CASCADE',
  })
  project: Project;
}
