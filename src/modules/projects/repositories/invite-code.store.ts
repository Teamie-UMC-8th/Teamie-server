// src/modules/projects/repositories/invite-code.store.ts
import { Injectable, Inject } from '@nestjs/common';
import { RedisClientType } from 'redis';
import {
    AlreadyProjectCompletedException,
    ExpiredInvitecodeException,
    InvalidInvitecodeException,
} from 'src/common/exceptions/custom.errors';

@Injectable()
export class InviteCodeStore {
    constructor(@Inject('REDIS_CLIENT') private readonly redis: RedisClientType) {}

    private activeKey = (code: string) => `invite:${code}`;
    private metaKey = (code: string) => `invite:meta:${code}`;
    private projectSetKey = (projectId: number) => `project:${projectId}:invites`;

    // 1) active 저장 + 만료시각 계산
    async saveActive(
        projectId: number,
        ttlSec: number
    ): Promise<{ code: string; expiresAt: string }> {
        const code = generateRandomCode();
        await this.redis.set(this.activeKey(code), String(projectId), { EX: ttlSec });
        await this.redis.sAdd(this.projectSetKey(projectId), code);
        const expiresAt = new Date(Date.now() + ttlSec * 1000).toISOString();
        return { code, expiresAt };
    }

    // 2) 메타키는 TTL 없이 남겨서 '완료/만료' 구분용
    async saveMeta(code: string, projectId: number): Promise<void> {
        await this.redis.set(this.metaKey(code), String(projectId));
    }

    // 3) 참여코드 → 프로젝트 id 조회 + 상태 구분
    async findProjectByInviteCode(inviteCode: string): Promise<number> {
        const codeKey = this.activeKey(inviteCode);
        const metaKey = this.metaKey(inviteCode);

        const projectIdStr = await this.redis.get(codeKey);
        if (projectIdStr) return Number(projectIdStr);

        if (await this.redis.exists(metaKey)) {
            const metaProjectIdStr = await this.redis.get(metaKey);
            if (metaProjectIdStr) throw new AlreadyProjectCompletedException();
            throw new ExpiredInvitecodeException();
        }
        throw new InvalidInvitecodeException();
    }

    // 4) 프로젝트별 남아있는 active 코드들
    async listCodesByProject(projectId: number): Promise<string[]> {
        return this.redis.sMembers(this.projectSetKey(projectId));
    }

    // 남아 있는 초대코드 redis 키 정리
    async removeCodes(codes: string[]): Promise<void> {
        if (!codes.length) return;
        const keys = codes.map((c) => this.activeKey(c));
        await this.redis.del(keys);
    }

    // project 세트 자체를 삭제
    async clearProjectSet(projectId: number): Promise<void> {
        await this.redis.del(this.projectSetKey(projectId));
    }
}

export function generateRandomCode(length = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
}
