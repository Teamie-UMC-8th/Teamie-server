import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Task } from '../tasks/tasks.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { PersonalRecall } from '../personalRecalls/personalRecalls.entity';
import { Plan } from '../plans/plans.entity';
import { UserProject } from '../mappings/userProjects/userProjects.entity';
import { ProjectFile } from '../mappings/projectFiles/projectFiles.entity';
import { MasterPortfolio } from '../masterPortfolios/masterPortfolios.entity';
import { Step } from '../steps/steps.entity';

@Entity()
export class Project extends BaseEntity{
    @Column({ length: 20 })
    name: string;

    @Column({length:300})
    goal: string;

    @Column({length:300})
    rule: string;

    @Column({ default: false })
    isCompleted: boolean;

    @Column()
    completedAt: Date;

    @OneToMany(() => PersonalRecall, (personalRecall) => personalRecall.project)
    personalRecalls: PersonalRecall[];

    @OneToMany(() => Plan, (plan) => plan.project)
    plans: Plan[];

    @OneToMany(() => UserProject, (userProject) => userProject.project)
    userProjects: UserProject[];

    @OneToMany(() => ProjectFile, (projectFile) => projectFile.project)
    projectFiles: ProjectFile[];

    @OneToMany(() => MasterPortfolio, (masterPF) => masterPF.project)
    masterPFs: MasterPortfolio[];

    @OneToMany(() => Step, (step) => step.project)
    steps: Step[];
}
