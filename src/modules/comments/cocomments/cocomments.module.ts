import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cocomment } from './entities/cocomments.entity';
import { CocommentsController } from './cocomments.controller';
import { CocommentsService } from './services/cocomments.service';
import { CocommentRepository } from './repositories/cocoment.repository';
import { CocommentsListener } from './listener/cocomments.listener';
import { GateWayModule } from 'src/infra/gateway/gateway.module';
@Module({
    imports: [TypeOrmModule.forFeature([Cocomment]), GateWayModule],
    controllers: [CocommentsController],
    providers: [CocommentsService, CocommentRepository, CocommentsListener],
    exports: [CocommentRepository, CocommentsService],
})
export class CocommentsModule {}
