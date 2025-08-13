export function getPeriod(createdAt: Date, completedAt: Date): string {
    createdAt = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
    completedAt = typeof completedAt === 'string' ? new Date(completedAt) : completedAt;

    let years = completedAt.getFullYear() - createdAt.getFullYear();
    let months = completedAt.getMonth() - createdAt.getMonth();
    let days = completedAt.getDate() - createdAt.getDate();

    if (years === 0 && months === 0) {
        // 같은 해, 같은 달인 경우 일 차이만 계산
        if (days === 0) {
            return '0일';
        }
        return `${days}일`;
    }

    // 월 차이가 음수인 경우 보정
    if (days < 0) {
        months -= 1;
        const prevMonth = new Date(completedAt.getFullYear(), completedAt.getMonth(), 0);
        days += prevMonth.getDate();
    }
    // 연 차이가 음수인 경우 보정
    if (months < 0) {
        years -= 1;
        months += 12;
    }

    // 0인 단위는 표시하지 않음
    const period: string[] = [];
    if (years > 0) period.push(`${years}년`);
    if (months > 0) period.push(`${months}개월`);
    if (days > 0) period.push(`${days}일`);
    return period.join(' ');
}
