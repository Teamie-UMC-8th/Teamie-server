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
                        createdAt: '2025-08-03T19:50:31.920Z',
                        managers: [
                            {
                                userId: 123,
                                name: '홍길동',
                                imageUrl: 'https://s3:example.com/profile/example.png',
                            },
                        ],
                    },
                ],
                taskCursor:
                    'eyJkZWFkbGluZSI6IjIwMjUtMDgtMDlUMTU6MDA6MDAuMDAwWiIsImNyZWF0ZWRBdCI6IjIwMjUtMDktMDZUMTA6MTA6MzcuNDEyWiJ9',
            },
            {
                projectId: 345,
                projectName: '프로젝트B',
                tasks: [],
                taskCursor: null,
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
                takCursor: null,
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

export const hasNextPageExampleOfMyTasksMore = {
    isSuccess: true,
    error: null,
    result: {
        data: [
            {
                id: 12,
                name: '9월 정기모임 운영 공지',
                status: 'ONGOING',
                deadline: '2025-09-01T14:59:59.000Z',
                createdAt: '2025-08-21T19:50:31.849Z',
                managers: [
                    {
                        userId: 123,
                        name: '홍길동',
                        imageUrl: 'https://s3:example.com/profile/example.png',
                    },
                ],
            },
            {
                id: 15,
                name: '가을행사 운영기획안 작성',
                status: 'ONGOING',
                deadline: '2025-09-13T14:59:59.000Z',
                createdAt: '2025-08-21T19:50:31.867Z',
                managers: [
                    {
                        userId: 123,
                        name: '홍길동',
                        imageUrl: 'https://s3:example.com/profile/example.png',
                    },
                ],
            },
            {
                id: 13,
                name: '9월 정기모임 회계 처리',
                status: 'NOTSTART',
                deadline: '2025-09-20T14:59:59.000Z',
                createdAt: '2025-08-21T19:50:31.854Z',
                managers: [
                    {
                        userId: 123,
                        name: '홍길동',
                        imageUrl: 'https://s3:example.com/profile/example.png',
                    },
                ],
            },
            {
                id: 14,
                name: '9월 정기모임 피드백 정리',
                status: 'NOTSTART',
                deadline: '2025-09-20T14:59:59.000Z',
                createdAt: '2025-08-21T19:50:31.860Z',
                managers: [
                    {
                        userId: 123,
                        name: '홍길동',
                        imageUrl: 'https://s3:example.com/profile/example.png',
                    },
                ],
            },
            {
                id: 16,
                name: '가을행사 운영 공지',
                status: 'NOTSTART',
                deadline: '2025-09-28T14:59:59.000Z',
                createdAt: '2025-08-21T19:50:31.872Z',
                managers: [
                    {
                        userId: 123,
                        name: '홍길동',
                        imageUrl: 'https://s3:example.com/profile/example.png',
                    },
                ],
            },
        ],
        pageInfo: {
            nextCursor:
                'eyJkZWFkbGluZSI6IjIwMjUtMDktMjhUMTQ6NTk6NTkuMDAwWiIsImNyZWF0ZWRBdCI6IjIwMjUtMDgtMjFUMTk6NTA6MzEuODcyWiJ9',
            hasNextPage: true,
        },
    },
};

export const lastPageExampleOfMyTasksMore = {
    isSuccess: true,
    error: null,
    result: {
        data: [
            {
                id: 25,
                name: '12월 정기모임 운영 공지',
                status: 'NOTSTART',
                deadline: '2025-12-01T14:59:59.000Z',
                createdAt: '2025-08-21T19:50:31.920Z',
                managers: [
                    {
                        userId: 123,
                        name: '홍길동',
                        imageUrl: 'https://s3:example.com/profile/example.png',
                    },
                ],
            },
            {
                id: 26,
                name: '12월 정기모임 회계 처리',
                status: 'NOTSTART',
                deadline: '2025-12-26T14:59:59.000Z',
                createdAt: '2025-08-21T19:50:31.926Z',
                managers: [
                    {
                        userId: 123,
                        name: '홍길동',
                        imageUrl: 'https://s3:example.com/profile/example.png',
                    },
                ],
            },
            {
                id: 27,
                name: '12월 정기모임 피드백 정리',
                status: 'NOTSTART',
                deadline: '2025-12-29T14:59:59.000Z',
                createdAt: '2025-08-21T19:50:31.933Z',
                managers: [
                    {
                        userId: 123,
                        name: '홍길동',
                        imageUrl: 'https://s3:example.com/profile/example.png',
                    },
                ],
            },
            {
                id: 9,
                name: '기획국 하반기 결산보고안 작성',
                status: 'ONGOING',
                deadline: '2026-01-07T14:59:59.000Z',
                createdAt: '2025-08-21T19:50:31.819Z',
                managers: [
                    {
                        userId: 123,
                        name: '홍길동',
                        imageUrl: 'https://s3:example.com/profile/example.png',
                    },
                ],
            },
        ],
        pageInfo: {
            nextCursor: '2025-08-15T00:00:00Z',
            hasNextPage: true,
        },
    },
};
