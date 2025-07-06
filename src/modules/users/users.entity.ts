import { Entity, Column, OneToMany } from 'typeorm';
import { Comment } from '../comments/comments.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { PersonalRecall } from '../personalRecalls/personalRecalls.entity';
import { UserProject } from '../mappings/userProjects/userProjects.entity';
import { Manager } from '../mappings/managers/managers.entity';
import { TaskFile } from '../mappings/taskFiles/taskFiles.entity';
import { ProjectFile } from '../mappings/projectFiles/projectFiles.entity';
import { Writer } from '../mappings/writers/writers.entity';
import { Attendee } from '../mappings/attendees/attendees.entity';
import { MasterPortpolio } from '../masterPortpolios/masterPortpolios.entity';
import { PortpolioAI } from '../portpolioAIs/portpolioAIs.entity';

@Entity()
export class User extends BaseEntity {
    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column()
    school: string;

    @Column()
    tier: string; // NOTE: 추후 ENUM으로 바꾸기(요금제 확정 시)

    @Column({ default: 0 })
    point: number;

    @Column()
    imageUrl: string;

    // TODO: 로그인 관련 로직 구현 시 accessToken 등 필드 추가

    @Column()
    credit: number;

    @Column({ default: 0 })
    projectNum: number;

    @Column({ default: true })
    isActive: boolean;

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

    @OneToMany(() => MasterPortpolio, (masterPP) => masterPP.user)
    masterPPs: MasterPortpolio[];

    @OneToMany(() => PortpolioAI, (ppAI) => ppAI.user)
    ppAIs: PortpolioAI[];
}