export const MasterPortfolioResponseFormat = {
    type: 'json_object',
    schema: {
        type: 'object',
        properties: {
            detailInfo: {
                type: 'string',
                description: '프로젝트의 상세 정보',
            },
            assignedTask: {
                type: 'string',
                description: '프로젝트에서 담당한 업무',
            },
            keyAchievement: {
                type: 'string',
                description: '프로젝트의 주요 성과',
            },
            insight: {
                type: 'string',
                description: '프로젝트를 통해 배운 점',
            },
        },
        required: ['detailInfo', 'assignedTask', 'keyAchievment', 'insight'],
    },
};
