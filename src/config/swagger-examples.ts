export const hasNextPageExampleOfMyTasks = {
    isSuccess: true,
    error: null,
    result: {
        data: [
            {
                projectId: 123,
                projectName: '프로젝트A',
                tasks: [
                    {
                        id: 123,
                        name: '1차 과제 제출용 와이어프레임',
                        status: 'ONGOING',
                        deadline: '2025-08-15T10:00:00Z',
                        managers: [
                            {
                                userId: 123,
                                name: '홍길동',
                                imageUrl: 'https://s3:example.com/profile/example.png',
                            },
                        ],
                    },
                ],
            },
            {
                projectId: 345,
                projectName: '프로젝트B',
                tasks: [],
            },
        ],
        pageInfo: {
            nextCursor: '2025-08-15T00:00:00Z',
            hasNextPage: true,
        },
    },
};

export const lastPageExampleOfMyTasks = {
    isSuccess: true,
    error: null,
    result: {
        data: [
            {
                projectId: 815,
                projectName: '가장 최근 프로젝트',
                tasks: [],
            },
        ],
        pageInfo: {
            nextCursor: null,
            hasNextPage: false,
        },
    },
};

export const hasNextPageExampleOfMyPortfolios = {
    isSuccess: true,
    error: null,
    result: {
        data: [
            {
                portfolioId: 123,
                projectName: '프로젝트A',
                category: 'COURSE',
                contributionRate: 74,
                startDate: '2025-04-18T10:00:00Z',
                endDate: '2025-06-18T10:00:00Z',
                mainTask: '카드뉴스 기획 및 제작',
            },
        ],
        pageInfo: {
            nextCursor: '2025-04-18T10:00:00Z',
            hasNextPage: true,
        },
    },
};

export const lastPageExampleOfMyPortfolios = {
    isSuccess: true,
    error: null,
    result: {
        data: [],
        pageInfo: {
            nextCursor: null,
            hasNextPage: false,
        },
    },
};

export const hasNextPageExampleOfMyCorrections = {
    isSuccess: true,
    error: null,
    result: {
        data: [
            {
                correctionId: 123,
                title: 'A기업1',
                createdAt: '2025-06-13T10:00:00Z',
                jobTitle: '브랜드 마케터',
                submissionTarget: 'A기업',
            },
        ],
        pageInfo: {
            nextCursor: '2025-06-13T10:00:00Z',
            hasNextPage: true,
        },
    },
};

export const lastPageExampleOfMyCorrections = {
    isSuccess: true,
    error: null,
    result: {
        data: [],
        pageInfo: {
            nextCursor: null,
            hasNextPage: false,
        },
    },
};
