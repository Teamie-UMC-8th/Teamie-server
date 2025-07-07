import { BaseEntity } from "src/common/entities/base.entity";
import { Task } from "src/modules/tasks/tasks.entity";
import { User } from "src/modules/users/users.entity";
import { Entity, ManyToOne } from "typeorm";

@Entity()
export class Manager extends BaseEntity {//담당자
    @ManyToOne(() => User, (user) => user.managers, {onDelete: 'CASCADE'})
    user: User;

    @ManyToOne(() => Task, (task) => task.managers, {onDelete: 'CASCADE'})
    task: Task;
}