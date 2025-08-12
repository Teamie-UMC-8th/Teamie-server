import { applyDecorators } from '@nestjs/common';
import { ApiResponse, ApiResponseOptions } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

interface ErrorExample {
    errorCode: string;
    reason: string;
    data?: any;
}

export function ApiCommonErrorResponses(
    status: HttpStatus,
    examples: ErrorExample | ErrorExample[]
) {
    const list = Array.isArray(examples) ? examples : [examples];

    const swaggerExamples = list.reduce(
        (acc, ex, idx) => {
            acc[`case${idx + 1}`] = {
                summary: ex.reason,
                value: {
                    isSuccess: false,
                    error: { errorCode: ex.errorCode, reason: ex.reason, data: ex.data ?? null },
                    result: null,
                },
            };
            return acc;
        },
        {} as Record<string, any>
    );

    return applyDecorators(
        ApiResponse({
            status,
            content: { 'application/json': { examples: swaggerExamples } },
        } as ApiResponseOptions)
    );
}
