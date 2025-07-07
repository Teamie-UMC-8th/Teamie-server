import { BaseEntity } from "src/common/entities/base.entity";
import { Plan } from "src/modules/plans/plans.entity";
import { User } from "src/modules/users/users.entity";
import { Entity, ManyToOne } from "typeorm";

@Entity()
export class Attendee extends BaseEntity{
    @ManyToOne(() => User, (user) => user.attendees, {onDelete: 'CASCADE'})
    user: User;

    @ManyToOne(() => Plan, (plan) => plan.attendees, {onDelete: 'CASCADE'})
    plan: Plan;
}