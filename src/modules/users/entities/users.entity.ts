import { Entity, Column, OneToMany } from 'typeorm';
import { Comment } from '../../comments/comments.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { PersonalRecall } from '../../personalRecalls/entities/personalRecalls.entity';
import { UserProject } from '../../mappings/userProjects/userProjects.entity';
import { Manager } from '../../mappings/managers/managers.entity';
import { TaskFile } from '../../mappings/taskFiles/taskFiles.entity';
import { ProjectFile } from '../../mappings/projectFiles/projectFiles.entity';
import { Writer } from '../../mappings/writers/writers.entity';
import { Attendee } from '../../mappings/attendees/attendees.entity';
import { MasterPortfolio } from '../../masterPortfolios/masterPortfolios.entity';
import { FinalPortfolio } from '../../finalPortfolios/finalPortfolios.entity';

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

    @Column({ nullable: true })
    tier: string; // NOTE: 추후 ENUM으로 바꾸기(요금제 확정 시)

    @Column({ length: 255 })
    imageUrl: string;

    @Column({
        type: 'bigint',
        unique: true,
    })
    kakaoId: string;

    @Column({ default: 0 })
    credit: number;

    @Column({ default: 0 })
    projectNum: number;

    @Column({ default: true })
    isActive: boolean;

    @Column({
        length: 15,
        nullable: true,
    })
    major: string;

    @OneToMany(() => Comment, (comment) => comment.user)
    comments: Comment[];

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

    @OneToMany(() => FinalPortfolio, (finalPortfolio) => finalPortfolio.user)
    finalPortfolios: FinalPortfolio[];
}
