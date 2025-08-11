import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { Comment } from '../entities/comments.entity';
import { CommentNotFoundException } from '../../../common/exceptions/custom.errors';
export class CommentRepository {
    constructor(@InjectRepository(Comment) private readonly repo: Repository<Comment>) {}

    // comment 조회
    async findCommentByIdWithQueryRunner(
        queryRunner: QueryRunner,
        commentId: number
    ): Promise<Comment> {
        const comment = await queryRunner.manager.findOne(Comment, {
            where: { id: commentId },
        });

        if (!comment) {
            throw new CommentNotFoundException();
        }

        return comment;
    }

    // taskId로 comments 조회
    async findCommentsByTaskIdWithQueryRunner(
        queryRunner: QueryRunner,
        taskId: number
    ): Promise<Comment[]> {
        return queryRunner.manager.find(Comment, {
            where: { task: { id: taskId } },
        });
    }

    // 작성자(User)와 함께 comment조회
    async findByIdWithUserWithQueryRunner(
        queryRunner: QueryRunner,
        commentId: number
    ): Promise<Comment> {
        const comment = await queryRunner.manager
            .createQueryBuilder(Comment, 'comment')
            .leftJoinAndSelect('comment.user', 'user')
            .select(['comment.id', 'comment.content'])
            .addSelect(['user.id'])
            .where('comment.id = :commentId', { commentId })
            .getOne();

        if (!comment) {
            throw new CommentNotFoundException();
        }
        return comment;
    }

    // 업무 상세페이지 댓글 조회
    async findByTaskIdWithCocommentsPaginated(
        taskId: number,
        limit: number,
        offset: number
    ): Promise<Comment[]> {
        return this.repo
            .createQueryBuilder('comment')
            .leftJoinAndSelect('comment.user', 'user') // 댓글 작성자
            .leftJoinAndSelect('comment.cocomments', 'cocomment') // 대댓글
            .leftJoinAndSelect('cocomment.user', 'cocommentUser') // 대댓글 작성자
            .where('comment.taskId = :taskId', { taskId })
            .orderBy('comment.createdAt', 'DESC')
            .addOrderBy('cocomment.createdAt', 'DESC')
            .skip(offset)
            .take(limit)
            .select([
                'comment.id',
                'comment.content',
                'comment.createdAt',
                'comment.updatedAt',
                'user.id',
                'user.name',
                'user.imageUrl',
                'cocomment.id',
                'cocomment.content',
                'cocomment.createdAt',
                'cocomment.updatedAt',
                'cocommentUser.id',
                'cocommentUser.name',
                'cocommentUser.imageUrl',
            ])
            .getMany();
    }

    //task별 댓글 개수 조회
    async countByTaskId(taskId: number): Promise<number> {
        return this.repo.count({
            where: { task: { id: taskId } },
        });
    }

    // comment 삭제
    async deleteCommentWithQueryRunner(queryRunner: QueryRunner, commentId: number): Promise<void> {
        await queryRunner.manager.delete(Comment, { id: commentId });
    }

    // comment 저장
    async saveCommentWithQueryRunner(queryRunner: QueryRunner, comment: Comment): Promise<Comment> {
        return queryRunner.manager.save(Comment, comment);
    }
}
