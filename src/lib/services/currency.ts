import { getCached, setCache } from '../cache/redis';

const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest';
const CACHE_KEY = 'currency:rates:KRW';
const CACHE_TTL = 3600 * 24; // 24 hours

export interface ExchangeRates {
    [key: string]: number;
}

export class CurrencyService {
    /**
     * KRW 기준 환율 정보를 가져옵니다.
     * 캐시가 있으면 캐시를 반환하고, 없으면 API를 호출합니다.
     */
    static async getKRWRates(): Promise<ExchangeRates> {
        // 1. 캐시 확인
        const cached = await getCached<ExchangeRates>(CACHE_KEY);
        if (cached) return cached;

        try {
            // 2. API 호출 (KRW 기준)
            const response = await fetch(`${EXCHANGE_RATE_API}/KRW`);
            if (!response.ok) throw new Error('Failed to fetch exchange rates');
            
            const data = await response.json();
            const rates = data.rates; // KRW 1당 각 통화의 가치 (예: KRW 1 = 0.00068 EUR)
            
            // 우리가 필요한 건 1 foreign currency = X KRW 이므로 역수를 구함
            const krwRates: ExchangeRates = {};
            for (const [currency, rate] of Object.entries(rates as Record<string, number>)) {
                krwRates[currency] = 1 / rate;
            }

            // 3. 캐시 저장
            await setCache(CACHE_KEY, krwRates, CACHE_TTL);
            return krwRates;
        } catch (error) {
            console.error('[CurrencyService] Error fetching rates:', error);
            // API 실패 시 기본값 (Fallback)
            // 2026년 기준 최신화된 보수적 환율 적용
            return {
                'EUR': 1510,
                'USD': 1420,
                'JPY': 9.5
            };
        }
    }

    /**
     * 특정 통화 금액을 KRW로 변환합니다.
     */
    static async convertToKRW(amount: number, fromCurrency: string): Promise<number> {
        if (fromCurrency === 'KRW') return amount;
        
        const rates = await this.getKRWRates();
        const rate = rates[fromCurrency];
        
        if (!rate) {
            console.warn(`[CurrencyService] No rate found for ${fromCurrency}, using 1:1`);
            return amount;
        }
        
        return amount * rate;
    }
}
