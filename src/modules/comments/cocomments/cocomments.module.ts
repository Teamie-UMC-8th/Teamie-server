import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cocomment } from './entities/cocomments.entity';
import { CocommentsController } from './cocomments.controller';
import { CocommentsService } from './services/cocomments.service';
import { CocommentRepository } from './repositories/cocoment.repository';
@Module({
    imports: [TypeOrmModule.forFeature([Cocomment])],
    controllers: [CocommentsController],
    providers: [CocommentsService, CocommentRepository],
    exports: [CocommentRepository, CocommentsService],
})
export class CocommentsModule {}
