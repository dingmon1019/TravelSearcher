import { LocationOption } from '../types/flight';
import { AmadeusService } from './amadeus-service';

const ALL_LOCATIONS: LocationOption[] = [
    // --- Groups (Regions/Themes) ---
    { id: 'region-kr', type: 'group', label: '🇰🇷 한국 전역', sub: '인천, 김포, 부산, 제주', keywords: ['한국', '국내', 'korea'] },
    { id: 'region-jp', type: 'group', label: '🇯🇵 일본 전역', sub: '도쿄, 오사카, 후쿠오카, 삿포로, 오키나와', keywords: ['일본', 'japan'] },
    { id: 'region-sea', type: 'group', label: '🏝 동남아 묶음', sub: '베트남, 태국, 필리핀, 싱가포르', keywords: ['동남아', 'southeast asia'] },
    { id: 'region-eu', type: 'group', label: '🇪🇺 유럽 전역', sub: '파리, 런던, 로마, 프라하, 바르셀로나', keywords: ['유럽', 'europe'] },
    { id: 'region-usa', type: 'group', label: '🇺🇸 미주 묶음', sub: '뉴욕, LA, 샌프란시스코, 하와이', keywords: ['미주', '미국', 'usa'] },
    { id: 'region-oce', type: 'group', label: '🦘 오세아니아', sub: '시드니, 멜버른, 괌, 사이판', keywords: ['오세아니아', 'oceania'] },

    // Theme Groups
    { id: 'theme-shopping', type: 'group', label: '🛍 쇼핑 천국', sub: '도쿄, 홍콩, 파리, 뉴욕', keywords: ['쇼핑', 'shopping'] },
    { id: 'theme-healing', type: 'group', label: '🌿 힐링/휴양', sub: '발리, 다낭, 세부, 푸켓', keywords: ['힐링', '휴양', 'healing'] },
    { id: 'theme-month', type: 'group', label: '🏠 한 달 살기 성지', sub: '치앙마이, 방콕, 쿠알라룸푸르', keywords: ['한달살기', '디지털노마드'] },

    // --- Cities ---
    // Korea
    { id: 'city-icn', type: 'city', label: '인천 (ICN)', sub: '대한민국', keywords: ['인천', '서울', 'seoul', 'icn'] },
    { id: 'city-gmp', type: 'city', label: '김포 (GMP)', sub: '대한민국', keywords: ['김포', '서울', 'seoul', 'gmp'] },
    { id: 'city-pus', type: 'city', label: '부산 (PUS)', sub: '대한민국', keywords: ['부산', '김해', 'busan', 'pus'] },
    { id: 'city-cju', type: 'city', label: '제주 (CJU)', sub: '대한민국', keywords: ['제주', 'jeju', 'cju'] },

    // Japan
    { id: 'city-nrt', type: 'city', label: '도쿄 (NRT)', sub: '일본', keywords: ['도쿄', '나리타', 'tokyo', 'nrt'] },
    { id: 'city-hnd', type: 'city', label: '도쿄 (HND)', sub: '일본', keywords: ['도쿄', '하네다', 'tokyo', 'hnd'] },
    { id: 'city-kix', type: 'city', label: '오사카 (KIX)', sub: '일본', keywords: ['오사카', '간사이', 'osaka', 'kix'] },
    { id: 'city-fuk', type: 'city', label: '후쿠오카 (FUK)', sub: '일본', keywords: ['후쿠오카', 'fukuoka', 'fuk'] },
    { id: 'city-cts', type: 'city', label: '삿포로 (CTS)', sub: '일본', keywords: ['삿포로', '훗카이도', 'sapporo', 'cts'] },

    // South East Asia
    { id: 'city-dad', type: 'city', label: '다낭 (DAD)', sub: '베트남', keywords: ['다낭', 'danang', 'dad'] },
    { id: 'city-han', type: 'city', label: '하노이 (HAN)', sub: '베트남', keywords: ['하노이', 'hanoi', 'han'] },
    { id: 'city-sgn', type: 'city', label: '호치민 (SGN)', sub: '베트남', keywords: ['호치민', 'sgn'] },
    { id: 'city-bkk', type: 'city', label: '방콕 (BKK)', sub: '태국', keywords: ['방콕', 'bangkok', 'bkk'] },
    { id: 'city-cnx', type: 'city', label: '치앙마이 (CNX)', sub: '태국', keywords: ['치앙마이', 'cnx'] },
    { id: 'city-sin', type: 'city', label: '싱가포르 (SIN)', sub: '싱가포르', keywords: ['싱가포르', 'singapore', 'sin'] },
    { id: 'city-ceb', type: 'city', label: '세부 (CEB)', sub: '필리핀', keywords: ['세부', 'cebu', 'ceb'] },

    // Europe
    { id: 'city-cdg', type: 'city', label: '파리 (CDG)', sub: '프랑스', keywords: ['파리', 'paris', 'cdg'] },
    { id: 'city-lhr', type: 'city', label: '런던 (LHR)', sub: '영국', keywords: ['런던', 'london', 'lhr'] },
    { id: 'city-fco', type: 'city', label: '로마 (FCO)', sub: '이탈리아', keywords: ['로마', 'rome', 'fco'] },

    // USA
    { id: 'city-jfk', type: 'city', label: '뉴욕 (JFK)', sub: '미국', keywords: ['뉴욕', 'newyork', 'jfk'] },
    { id: 'city-lax', type: 'city', label: '로스앤젤레스 (LAX)', sub: '미국', keywords: ['엘에이', 'la', 'lax'] },
    { id: 'city-hnl', type: 'city', label: '호놀룰루 (HNL)', sub: '하와이', keywords: ['하와이', 'hawaii', 'hnl'] },
];

export class LocationService {
    static async getAll(): Promise<LocationOption[]> {
        return ALL_LOCATIONS;
    }

    static async getDepartures(): Promise<LocationOption[]> {
        // 기본값: 대한민국 내 도시들
        return ALL_LOCATIONS.filter(loc =>
            loc.type === 'city' && (loc.sub === '대한민국' || loc.id.startsWith('region-kr'))
        );
    }

    static async getDestinations(): Promise<LocationOption[]> {
        // 기본값: 그룹(지역/테마) + 해외 주요 도시
        return ALL_LOCATIONS.filter(loc =>
            loc.type === 'group' || (loc.type === 'city' && loc.sub !== '대한민국')
        );
    }

    static async search(query: string): Promise<LocationOption[]> {
        if (!query) return this.getAll();

        const lowerQuery = query.toLowerCase();

        // 1. 내부 정적 데이터 검색
        const localResults = ALL_LOCATIONS.filter(loc =>
            loc.label.toLowerCase().includes(lowerQuery) ||
            loc.sub.toLowerCase().includes(lowerQuery) ||
            loc.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
        );

        // 2. 검색어가 2글자 이상이면 Amadeus API 연동
        if (query.length >= 2) {
            try {
                const token = await AmadeusService.getAccessToken();
                const response = await fetch(
                    `https://test.api.amadeus.com/v1/reference-data/locations?subType=CITY,AIRPORT&keyword=${encodeURIComponent(query)}&max=5`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.data) {
                        const amadeusResults: LocationOption[] = data.data.map((item: any) => ({
                            id: `city-${item.iataCode.toLowerCase()}`,
                            type: 'city',
                            label: `${item.name} (${item.iataCode})`,
                            sub: `${item.address.countryName}${item.address.cityName ? `, ${item.address.cityName}` : ''}`,
                            keywords: [item.name, item.iataCode, item.address.cityName, item.address.countryName]
                        }));

                        // 기존 결과와 합치고 중복 제거 (IATA 코드 기준)
                        const combined = [...localResults];
                        for (const am of amadeusResults) {
                            if (!combined.some(c => c.id === am.id)) {
                                combined.push(am);
                            }
                        }
                        return combined;
                    }
                }
            } catch (error) {
                console.error('[LocationService] Amadeus Search Error:', error);
            }
        }

        return localResults;
    }

    static async getByIds(ids: string[]): Promise<LocationOption[]> {
        return ALL_LOCATIONS.filter(loc => ids.includes(loc.id));
    }

    static async getGroupMembers(groupId: string): Promise<string[]> {
        // Simple mapping for mock
        const mapping: Record<string, string[]> = {
            'region-kr': ['city-icn', 'city-gmp', 'city-pus', 'city-cju'],
            'region-jp': ['city-nrt', 'city-hnd', 'city-kix', 'city-fuk', 'city-cts'],
            'region-sea': ['city-dad', 'city-han', 'city-sgn', 'city-bkk', 'city-cnx', 'city-sin', 'city-ceb'],
            'region-eu': ['city-cdg', 'city-lhr', 'city-fco'],
            'region-usa': ['city-jfk', 'city-lax', 'city-hnl'],
            'region-oce': ['city-hnl'], // Mock simplification
            'theme-shopping': ['city-nrt', 'city-cdg', 'city-jfk'],
            'theme-healing': ['city-dad', 'city-sin', 'city-ceb'],
            'theme-month': ['city-cnx', 'city-bkk'],
        };
        return mapping[groupId] || [];
    }

    static async resolveLocations(ids: string[]): Promise<string[]> {
        let resolved: string[] = [];
        for (const id of ids) {
            if (id.startsWith('region-') || id.startsWith('theme-')) {
                const members = await this.getGroupMembers(id);
                resolved = [...resolved, ...members];
            } else {
                resolved.push(id);
            }
        }
        return Array.from(new Set(resolved)); // Deduplicate
    }
}
