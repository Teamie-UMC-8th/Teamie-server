export function getAccessTokenFromCookie(cookieHeader: string): string | null {
    if (!cookieHeader) return null;

    // 쿠키 문자열을 ; 로 나누고 각 키=값 쌍을 분리
    const cookies = cookieHeader.split(';').reduce<Record<string, string>>((acc, cookiePart) => {
        const [key, ...valParts] = cookiePart.trim().split('=');
        if (!key) return acc;
        acc[key] = valParts.join('=');
        return acc;
    }, {});

    return cookies['accessToken'] || null;
}
