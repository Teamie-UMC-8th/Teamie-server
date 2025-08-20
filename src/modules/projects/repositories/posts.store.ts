// src/modules/projects/repositories/posts.store.ts
import { Injectable, Inject } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class PostsStore {
    constructor(@Inject('REDIS_CLIENT') private readonly redis: RedisClientType) {}

    private postKey = (projectId: number, postId: number) => `posts:${projectId}:${postId}`;
    private listKey = (projectId: number, prefix: string) => `${prefix}:${projectId}:posts`;

    // 전체 포스트 조회
    async findPosts(projectId: number, prefix: string): Promise<RedisPost[]> {
        const listKey = this.listKey(projectId, prefix);
        const idStrs = await this.redis.lRange(listKey, 0, -1); // string[]
        if (!idStrs.length) return [];

        const postKeys = idStrs.map((idStr) => this.postKey(projectId, Number(idStr)));
        const rawPosts = await this.redis.mGet(postKeys);

        return rawPosts
            .map((raw, idx) => (raw ? { ...JSON.parse(raw), id: Number(idStrs[idx]) } : null))
            .filter((p): p is RedisPost => p !== null);
    }

    // 포스트 저장
    async savePost(
        projectId: number,
        prefix: string,
        payload: { userId: number; content: string },
        ttlSec: number
    ): Promise<RedisPost> {
        const id = Number(generateRandomId(6));

        const post: RedisPost = {
            id,
            userId: payload.userId,
            content: payload.content,
            createdAt: new Date().toISOString(),
        };

        const postKey = this.postKey(projectId, id);
        const listKey = this.listKey(projectId, prefix);

        await this.redis.set(postKey, JSON.stringify(post), { EX: ttlSec });
        await this.redis.rPush(listKey, id.toString());

        return post;
    }

    // 포스트 삭제
    async deletePost(
        projectId: number,
        prefix: string,
        postId: number,
        userId: number
    ): Promise<'OK' | 'NOT_FOUND' | 'NOT_OWNER'> {
        const postKey = this.postKey(projectId, postId);
        const listKey = this.listKey(projectId, prefix);

        const raw = await this.redis.get(postKey);
        if (!raw) return 'NOT_FOUND';

        const post: RedisPost = JSON.parse(raw);
        if (post.userId !== userId) return 'NOT_OWNER';

        await this.redis.lRem(listKey, 0, postId.toString());
        await this.redis.del(postKey);
        return 'OK';
    }

    // 전체 포스트 삭제 (프로젝트 삭제 시)
    async deletePosts(projectId: number, prefix: string): Promise<void> {
        const listKey = this.listKey(projectId, prefix);
        const idStrs = await this.redis.lRange(listKey, 0, -1);

        if (idStrs.length) {
            const postKeys = idStrs.map((idStr) => this.postKey(projectId, Number(idStr)));
            await this.redis.del(postKeys);
        }
        await this.redis.del(listKey);
    }
}

function generateRandomId(length = 6): string {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}