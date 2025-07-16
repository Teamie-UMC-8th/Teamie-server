import { BaseEntity } from 'src/common/entities/base.entity';
import { Plan } from 'src/modules/plans/plans.entity';
import { User } from 'src/modules/users/entities/users.entity';
import { Entity, ManyToOne } from 'typeorm';

@Entity()
export class Writer extends BaseEntity {
    @ManyToOne(() => User, (user) => user.writers, { onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Plan, (plan) => plan.writers, { onDelete: 'CASCADE' })
    plan: Plan;
}
