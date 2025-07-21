import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Plan } from "./plans.entity";
import { Repository } from "typeorm";
import { PlanDetails } from "./dtos/plan-details.dto";
import { PlanNotFoundException } from "src/common/exceptions/custom.errors";

@Injectable()
export class PlansService{
    constructor(
        @InjectRepository(Plan)
        private readonly plansRepository: Repository<Plan>
    ){}

    async getDetails(planId: number): Promise<PlanDetails> {
        const plan = await this.plansRepository
            .createQueryBuilder('plan')
            .leftJoinAndSelect('plan.attendees', 'attendee')
            .leftJoinAndSelect('plan.writers', 'writer')
            .leftJoinAndSelect('attendee.user', 'attendeeUser')
            .leftJoinAndSelect('writer.user','writerUser')
            //TODO: @Column({ select: false }) 옵션 활용하여 쿼리 최적화
            .where('plan.id = :planId',{planId})
            .getOne();
        if(!plan) throw new PlanNotFoundException(planId);
        return PlanDetails.from(plan);
    }
}