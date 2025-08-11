import { Entity, Column, OneToMany } from 'typeorm';
import { Comment } from '../../comments/entities/comments.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { PersonalRecall } from '../../personal-recalls/entities/personal-recalls.entity';
import { UserProject } from '../../projects/entities/userProjects.entity';
import { Manager } from '../../mappings/managers/managers.entity';
import { TaskFile } from '../../mappings/task-files/task-files.entity';
import { ProjectFile } from '../../mappings/project-files/project-files.entity';
import { Writer } from '../../plans/entities/writers.entity';
import { Attendee } from '../../plans/entities/attendees.entity';
import { MasterPortfolio } from '../../master-portfolios/entities/master-portfolios.entity';
import { Cocomment } from '../../comments/cocomments/entities/cocomments.entity';
import { PortfolioCorrection } from 'src/modules/portfolio-corrections/entities/portfolio-correction.entity';

@Entity()
export class User extends BaseEntity {
    @Column({ length: 10 })
    name: string;

    @Column({
        unique: true,
        length: 255,
    })
    email: string;

    @Column({
        length: 15,
        nullable: true,
    })
    school: string;

    @Column({
        nullable: true,
        select: false,
    })
    tier: string; // NOTE: 추후 ENUM으로 바꾸기(요금제 확정 시)

    @Column({ length: 255 })
    imageUrl: string;

    @Column({
        type: 'bigint',
        unique: true,
        select: false,
    })
    kakaoId: string;

    @Column({
        default: 0,
        select: false,
    })
    credit: number;

    @Column({
        default: 0,
        select: false,
    })
    projectNum: number;

    @Column({
        default: true,
        select: false,
    })
    isActive: boolean;

    @Column({
        length: 15,
        nullable: true,
        select: false,
    })
    major: string;

    @OneToMany(() => Comment, (comment) => comment.user)
    comments: Comment[];

    @OneToMany(() => Cocomment, (cocomment) => cocomment.user)
    cocomments: Cocomment[];

    @OneToMany(() => PersonalRecall, (personalRecall) => personalRecall.user)
    personalRecalls: PersonalRecall[];

    @OneToMany(() => UserProject, (userProject) => userProject.user)
    userProjects: UserProject[];

    @OneToMany(() => Manager, (manager) => manager.user)
    managers: Manager[];

    @OneToMany(() => TaskFile, (taskFile) => taskFile.user)
    taskFiles: TaskFile[];

    @OneToMany(() => ProjectFile, (projectFile) => projectFile.user)
    projectFiles: ProjectFile[];

    @OneToMany(() => Writer, (writer) => writer.user)
    writers: Writer[];

    @OneToMany(() => Attendee, (attendee) => attendee.user)
    attendees: Attendee[];

    @OneToMany(() => MasterPortfolio, (masterPF) => masterPF.user)
    masterPFs: MasterPortfolio[];

    @OneToMany(() => PortfolioCorrection, (portfolioCorrection) => portfolioCorrection.user)
    portfolioCorrections: PortfolioCorrection[];
}
