import { Module } from "@nestjs/common";
import { PlansGateway } from "./gateways/plans.gateway";
import { PlansController } from "./plans.controller";

@Module({
    controllers: [PlansController],
    providers: [PlansGateway],
})
export class PlansModule{}