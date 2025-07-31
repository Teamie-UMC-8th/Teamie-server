import { forwardRef, Module } from '@nestjs/common';
import { PlansGateway } from './gateways/plans.gateway';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './plans.entity';
import { ProjectsModule } from '../projects/projects.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([Plan]), forwardRef(() => ProjectsModule), AuthModule],
    controllers: [PlansController],
    providers: [PlansGateway, PlansService],
    exports: [PlansService],
})
export class PlansModule {}
