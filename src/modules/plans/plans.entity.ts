import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { Project } from '../projects/entities/projects.entity';
import { Writer } from '../mappings/writers/writers.entity';
import { Attendee } from '../mappings/attendees/attendees.entity';

@Entity()
export class Plan extends BaseEntity {
    @Column({ length: 35, nullable: true })
    name: string;

    @Column()
    date: Date;

    @Column({ length: 20, nullable: true })
    location: string;

    @Column({ length: 500, nullable: true })
    memo: string; //비고

    @Column({ nullable: true })
    startHour: Date;

    @Column({ length: 5000, nullable: true })
    meetingRecords: string;

    @ManyToOne(() => Project, (project) => project.plans, {
        onDelete: 'CASCADE',
    })
    project: Project;

    @OneToMany(() => Writer, (writer) => writer.plan)
    writers: Writer[];

    @OneToMany(() => Attendee, (attendee) => attendee.plan)
    attendees: Attendee[];
}
