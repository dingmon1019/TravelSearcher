import { LocationOption } from '../types/flight';
import { AmadeusService } from './amadeus-service';

const ALL_LOCATIONS: LocationOption[] = [
    // --- Cities (Real Korean Airports) ---
    { id: 'city-icn', type: 'city', label: '인천 (ICN)', sub: '대한민국', keywords: ['인천', '서울', 'seoul', 'icn'] },
    { id: 'city-gmp', type: 'city', label: '김포 (GMP)', sub: '대한민국', keywords: ['김포', '서울', 'seoul', 'gmp'] },
    { id: 'city-pus', type: 'city', label: '부산 (PUS)', sub: '대한민국', keywords: ['부산', '김해', 'busan', 'pus'] },
    { id: 'city-cju', type: 'city', label: '제주 (CJU)', sub: '대한민국', keywords: ['제주', 'jeju', 'cju'] },
    { id: 'city-tae', type: 'city', label: '대구 (TAE)', sub: '대한민국', keywords: ['대구', 'daegu', 'tae'] },
    { id: 'city-kwj', type: 'city', label: '광주 (KWJ)', sub: '대한민국', keywords: ['광주', 'gwangju', 'kwj'] },
    { id: 'city-rsu', type: 'city', label: '여수 (RSU)', sub: '대한민국', keywords: ['여수', 'yeosu', 'rsu'] },

    // --- Popular Destinations (Initial Suggestions) ---
    { id: 'city-nrt', type: 'city', label: '도쿄 (NRT)', sub: '일본', keywords: ['도쿄', '나리타', 'tokyo', 'nrt'] },
    { id: 'city-kix', type: 'city', label: '오사카 (KIX)', sub: '일본', keywords: ['오사카', '간사이', 'osaka', 'kix'] },
    { id: 'city-fuk', type: 'city', label: '후쿠오카 (FUK)', sub: '일본', keywords: ['후쿠오카', 'fukuoka', 'fuk'] },
    { id: 'city-dad', type: 'city', label: '다낭 (DAD)', sub: '베트남', keywords: ['다낭', 'danang', 'dad'] },
    { id: 'city-bkk', type: 'city', label: '방콕 (BKK)', sub: '태국', keywords: ['방콕', 'bangkok', 'bkk'] },
    { id: 'city-cdg', type: 'city', label: '파리 (CDG)', sub: '프랑스', keywords: ['파리', 'paris', 'cdg'] },
    { id: 'city-jfk', type: 'city', label: '뉴욕 (JFK)', sub: '미국', keywords: ['뉴욕', 'newyork', 'jfk'] },
];

export class LocationService {
    static async getAll(): Promise<LocationOption[]> {
        return ALL_LOCATIONS;
    }

    static async getDepartures(): Promise<LocationOption[]> {
        // 기본값: 대한민국 내 주요 공항
        return ALL_LOCATIONS.filter(loc =>
            loc.type === 'city' && loc.sub === '대한민국'
        );
    }

    static async getDestinations(): Promise<LocationOption[]> {
        // 기본값: 인기 해외 도시
        return ALL_LOCATIONS.filter(loc =>
            loc.type === 'city' && loc.sub !== '대한민국'
        );
    }

    static async search(query: string): Promise<LocationOption[]> {
        if (!query) return this.getDestinations();

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
                    `https://test.api.amadeus.com/v1/reference-data/locations?subType=CITY,AIRPORT&keyword=${encodeURIComponent(query)}&max=10`,
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
        // ID가 'city-'로 시작하는 동적 생성 ID인 경우 Amadeus에서 정보를 가져와야 할 수도 있지만, 
        // 현재는 메모리 내 검색 및 정적 데이터 검색 선 수행
        return ALL_LOCATIONS.filter(loc => ids.includes(loc.id));
    }

    static async resolveLocations(ids: string[]): Promise<string[]> {
        // 이제 'region-' 그룹을 제거했으므로 단순 매핑만 수행
        return Array.from(new Set(ids));
    }
}
