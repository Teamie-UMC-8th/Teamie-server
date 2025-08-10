import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Cocomment } from './entities/cocomments.entity';
import { CocommentsController } from './cocomments.controller';
import { CocommentsService } from './services/cocomments.service';
import { CocommentRepository } from './repositories/cocoment.repository';
import { CommentsModule } from '../comments.module';
@Module({
    imports: [
        TypeOrmModule.forFeature([Cocomment]),
        ConfigModule,
        forwardRef(() => CommentsModule),
    ],
    controllers: [CocommentsController],
    providers: [CocommentsService, CocommentRepository],
    exports: [CocommentRepository, CocommentsService],
})
export class CocommentsModule {}
