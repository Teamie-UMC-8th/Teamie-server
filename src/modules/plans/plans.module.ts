import { Module } from "@nestjs/common";
import { PlansGateway } from "./gateways/plans.gateway";
import { PlansController } from "./plans.controller";
import { PlansService } from "./plans.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Plan } from "./plans.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Plan])],
    controllers: [PlansController],
    providers: [PlansGateway, PlansService],
})
export class PlansModule{}