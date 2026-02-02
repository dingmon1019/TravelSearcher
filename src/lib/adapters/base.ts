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
     * 지수 백오프를 이용한 재시도 래퍼
     */
    protected async withRetry<T>(
        fn: () => Promise<T>,
        maxRetries: number = 3,
        baseDelay: number = 500
    ): Promise<T> {
        let lastError: any
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn()
            } catch (error) {
                lastError = error
                // 마지막 시도면 루프 종료
                if (i === maxRetries - 1) break

                // 지수 백오프: 500ms, 1000ms, 2000ms...
                const delay = baseDelay * Math.pow(2, i)
                await new Promise(resolve => setTimeout(resolve, delay))
                console.warn(`[${this.name}] Retry ${i + 1}/${maxRetries} after ${delay}ms`)
            }
        }
        throw lastError
    }

    /**
     * 에러 핸들링 및 타임아웃, 재시도가 결합된 안전한 실행
     */
    protected async safeExecute<T>(
        fn: () => Promise<T>,
        fallback: T,
        options: { timeout?: number; retries?: number } = {}
    ): Promise<T> {
        const { timeout = 5000, retries = 2 } = options
        try {
            return await this.withTimeout(
                this.withRetry(fn, retries),
                timeout
            )
        } catch (error) {
            console.error(`[${this.name}] Final Execution Failed:`, error)
            return fallback
        }
    }
}
