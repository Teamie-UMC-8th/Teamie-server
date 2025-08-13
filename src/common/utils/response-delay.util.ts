async function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ResponseDelayManager {
    static async ensureMinimumDuration<T>(
        asyncOperation: Promise<T>,
        minDurationMs: number = 35000
    ): Promise<T> {
        const startTime = Date.now();

        // LLM 작업 실행
        const result = await asyncOperation;

        // 경과 시간 계산
        const elapsed = Date.now() - startTime;
        const remaining = minDurationMs - elapsed;

        // 35초보다 빠르게 끝났으면 남은 시간만큼 대기
        if (remaining > 0) {
            await delay(remaining);
        }

        console.log(`실제 걸린 시간: ${elapsed}ms, 대기 시간: ${remaining}ms`);

        return result;
    }
}
