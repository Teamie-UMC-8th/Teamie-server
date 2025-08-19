import { InternalServerError } from '../exceptions/custom.errors';
import { InputPortfolio, OutputItem, OutputPortfolio } from '../types/master-portfolio.type';

// 문자열을 줄 단위로 분할하고 빈 줄을 제거하는 함수
function splitToLines(text: string): string[] {
    return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}

function transformField(text: string): OutputItem[] {
    const lines = splitToLines(text);
    const result: OutputItem[] = [];
    let lineNumber = 1;

    for (const line of lines) {
        result.push({
            type: 'line',
            number: lineNumber++,
            text: line,
        });
    }
    return result;
}

function transformFieldWithHeader(text: string): OutputItem[] {
    const lines = splitToLines(text);
    const result: OutputItem[] = [];
    let lineNumber = 1;

    for (const line of lines) {
        // 대괄호로 감싸진 줄인지
        const headerMatch = line.match(/^\[([^\]]+)\]$/);
        if (headerMatch) {
            result.push({
                type: 'header',
                text: line,
            });
        } else {
            result.push({
                type: 'line',
                number: lineNumber++,
                text: line,
            });
        }
    }
    return result;
}

export class TransformMasterPortfolioUtil {
    static transformMasterPortfolio(masterPortfolio: InputPortfolio): OutputPortfolio {
        try {
            const result: OutputPortfolio = {
                detailInfo: transformField(masterPortfolio.detailInfo),
                assignedTask: transformFieldWithHeader(masterPortfolio.assignedTask),
                keyAchievement: transformField(masterPortfolio.keyAchievement),
                insight: transformField(masterPortfolio.insight),
            };
            return result;
        } catch (error) {
            throw new InternalServerError(
                `포트폴리오 변환 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
            );
        }
    }
}
