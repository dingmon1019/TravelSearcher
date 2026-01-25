import { SearchParams, FlightOffer } from '@/lib/types/flight'

/**
 * 항공권 제공업체 어댑터 인터페이스
 */
export interface FlightProviderAdapter {
    /**
     * 제공업체 이름
     */
    name: string

    /**
     * 항공권 검색
     */
    search(params: SearchParams): Promise<FlightOffer[]>

    /**
     * 딥링크 생성
     */
    getDeepLink?(offerId: string): Promise<string>
}

/**
 * 기본 어댑터 추상 클래스
 */
export abstract class BaseFlightAdapter implements FlightProviderAdapter {
    abstract name: string

    abstract search(params: SearchParams): Promise<FlightOffer[]>

    async getDeepLink(offerId: string): Promise<string> {
        // 기본 구현: 제공업체 홈페이지로 리다이렉트
        return `https://www.google.com/search?q=flight+${offerId}`
    }

    /**
     * 타임아웃 래퍼
     */
    protected async withTimeout<T>(
        promise: Promise<T>,
        timeoutMs: number = 5000
    ): Promise<T> {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
            ),
        ])
    }

    /**
     * 에러 핸들링 래퍼
     */
    protected async safeExecute<T>(
        fn: () => Promise<T>,
        fallback: T
    ): Promise<T> {
        try {
            return await fn()
        } catch (error) {
            console.error(`[${this.name}] Error:`, error)
            return fallback
        }
    }
}
