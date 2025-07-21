import { Entity, Column, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { PersonalRecall } from '../../personal-recalls/entities/personal-recalls.entity';
import { Plan } from '../../plans/plans.entity';
import { UserProject } from '../../mappings/user-projects/userProjects.entity';
import { ProjectFile } from '../../mappings/project-files/project-files.entity';
import { MasterPortfolio } from '../../master-portfolios/entities/master-portfolios.entity';
import { Step } from '../../steps/entities/steps.entity';

@Entity()
export class Project extends BaseEntity {
    @Column({ length: 20 })
    name: string;

    @Column({ length: 300 })
    goal: string;

    @Column({ length: 300 })
    rule: string;

    @Column({ default: false })
    isCompleted: boolean;

    @Column({ type: 'datetime', nullable: true })
    completedAt: Date | null;

    @OneToMany(() => PersonalRecall, (personalRecall) => personalRecall.project)
    personalRecalls: PersonalRecall[];

    @OneToMany(() => Plan, (plan) => plan.project)
    plans: Plan[];

    @OneToMany(() => UserProject, (userProject) => userProject.project)
    userProjects: UserProject[];

    @OneToMany(() => ProjectFile, (projectFile) => projectFile.project)
    projectFiles: ProjectFile[];

    @OneToOne(() => MasterPortfolio, (masterPortfolio) => masterPortfolio.project)
    masterPortfolio: MasterPortfolio;

    @OneToMany(() => Step, (step) => step.project)
    steps: Step[];
}
