import { MasterPortfolioContentCheckResult } from 'src/modules/master-portfolios/types/content-check.type';
import { MasterPortfolioOutput } from '../types/master-portfolio.type';

export function checkMasterPortfolioContentStructure(
    data: MasterPortfolioOutput
): MasterPortfolioContentCheckResult {
    const results: MasterPortfolioContentCheckResult = {};

    // 프로젝트명 검사 : 1~20자
    // results.projectName =
    //     typeof data.projectName === 'string' &&
    //     data.projectName.length > 0 &&
    //     data.projectName.length <= 20;

    // 상세정보 검사 : 최소 4개 이상의 리스트 (-로 시작)
    results.detailInfo =
        typeof data.detailInfo === 'string' && (data.detailInfo.match(/^- /gm)?.length ?? 0) >= 4;

    // 담당업무 검사 : [섹션명]으로 시작하는 구간 1개 이상, 각 섹션에 -로 시작하는 리스트 1개 이상
    // TODO: 구조(순서)까지는 검사하지 못하는 문제가 있음. 개선해볼 것
    results.assignedTask =
        typeof data.assignedTask === 'string' &&
        /\[.+\]/.test(data.assignedTask) &&
        (data.assignedTask.match(/^- /gm)?.length ?? 0) >= 1;

    // 주요성과 검사 : -로 시작하는 리스트 2개 이상
    results.keyAchievement =
        typeof data.keyAchievement === 'string' &&
        (data.keyAchievement.match(/^- /gm)?.length ?? 0) >= 2;

    // 배운점 검사 : -로 시작하는 문장 2개 이상
    results.insight =
        typeof data.insight === 'string' && (data.insight.match(/^- /gm)?.length ?? 0) >= 2;

    return results;
}
