// src/modules/projects/repositories/posts.store.ts
import { Injectable, Inject } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { PostNotFoundException } from 'src/common/exceptions/custom.errors';

@Injectable()
export class PostsStore {
    constructor(@Inject('REDIS_CLIENT') private readonly redis: RedisClientType) {}

    private key = (projectId: number, prefix: string) => `${prefix}:${projectId}`;

    async findPosts(projectId: number, prefix: string): Promise<RedisPost[]> {
        const raw = await this.redis.get(this.key(projectId, prefix));
        if (!raw) return [];
        return JSON.parse(raw) as RedisPost[];
    }
    async savePost(
        projectId: number,
        prefix: string,
        payload: { userId: number; content: string },
        ttlSec: number,
        maxCount: number
    ): Promise<RedisPost> {
        const posts = await this.findPosts(projectId, prefix);
        if (posts.length >= maxCount) throw new Error('POSTS_LIMIT');

        const id = posts.length ? Math.max(...posts.map((p) => p.id)) + 1 : 1;
        const post: RedisPost = {
            id,
            userId: payload.userId, // ← 여기서 반드시 넣음
            content: payload.content,
            createdAt: new Date().toISOString(),
        };
        posts.push(post);
        await this.savePosts(projectId, prefix, posts, ttlSec);
        return post;
    }

    async savePosts(
        projectId: number,
        prefix: string,
        posts: RedisPost[],
        ttlSec: number
    ): Promise<void> {
        await this.redis.set(this.key(projectId, prefix), JSON.stringify(posts));
        await this.redis.expire(this.key(projectId, prefix), ttlSec);
    }
    async deletePost(
        projectId: number,
        prefix: string,
        postId: number,
        userId: number,
        ttlSec: number
    ): Promise<'OK' | 'NOT_FOUND' | 'NOT_OWNER'> {
        const posts = await this.findPosts(projectId, prefix);
        const idx = posts.findIndex((p) => p.id === postId);
        if (idx === -1) return 'NOT_FOUND';

        const target = posts[idx];
        if (Number(target.userId) !== Number(userId)) return 'NOT_OWNER';

        posts.splice(idx, 1);
        if (posts.length === 0) {
            await this.deletePosts(projectId, prefix);
        } else {
            await this.savePosts(projectId, prefix, posts, ttlSec);
        }
        return 'OK';
    }

    async deletePosts(projectId: number, prefix: string): Promise<void> {
        await this.redis.del(this.key(projectId, prefix));
    }
}
