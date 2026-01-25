import { SearchParams, FlightOffer } from '@/lib/types/flight'
import { FlightProviderAdapter } from '@/lib/adapters/base'
import { MockFlightAdapter } from '@/lib/adapters/mock'

/**
 * 항공권 검색 집계 서비스
 * 여러 제공업체로부터 결과를 수집하고 병합
 */
export class FlightAggregator {
    private adapters: FlightProviderAdapter[]

    constructor(adapters?: FlightProviderAdapter[]) {
        // 기본값: Mock 어댑터만 사용
        this.adapters = adapters || [new MockFlightAdapter()]
    }

    /**
     * 모든 제공업체에서 병렬로 검색
     */
    async searchAll(params: SearchParams): Promise<FlightOffer[]> {
        // Promise.allSettled로 일부 실패해도 계속 진행
        const results = await Promise.allSettled(
            this.adapters.map(adapter =>
                this.searchWithTimeout(adapter, params, 5000)
            )
        )

        // 성공한 결과만 수집
        const allOffers = results
            .filter((result): result is PromiseFulfilledResult<FlightOffer[]> =>
                result.status === 'fulfilled'
            )
            .flatMap(result => result.value)

        // 중복 제거 (같은 항공편)
        const uniqueOffers = this.deduplicateOffers(allOffers)

        // 정렬
        return this.sortOffers(uniqueOffers, params.sort || 'price')
    }

    /**
     * 타임아웃이 있는 검색
     */
    private async searchWithTimeout(
        adapter: FlightProviderAdapter,
        params: SearchParams,
        timeoutMs: number
    ): Promise<FlightOffer[]> {
        return Promise.race([
            adapter.search(params),
            new Promise<FlightOffer[]>((_, reject) =>
                setTimeout(() => reject(new Error(`${adapter.name} timeout`)), timeoutMs)
            ),
        ])
    }

    /**
     * 중복 제거
     */
    private deduplicateOffers(offers: FlightOffer[]): FlightOffer[] {
        const seen = new Set<string>()
        return offers.filter(offer => {
            const key = `${offer.airline}-${offer.flightNumber}-${offer.departureTime}-${offer.departureDate}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })
    }

    /**
     * 정렬
     */
    private sortOffers(offers: FlightOffer[], sortBy: string): FlightOffer[] {
        switch (sortBy) {
            case 'price':
                return offers.sort((a, b) => a.price - b.price)
            case 'duration':
                return offers.sort((a, b) => {
                    const durationA = this.parseDuration(a.duration)
                    const durationB = this.parseDuration(b.duration)
                    return durationA - durationB
                })
            case 'departure':
                return offers.sort((a, b) => a.departureTime.localeCompare(b.departureTime))
            default:
                return offers
        }
    }

    /**
     * 소요시간 파싱 (분 단위)
     */
    private parseDuration(duration: string): number {
        const match = duration.match(/(\d+)h\s*(\d+)m/)
        if (!match) return 0
        return parseInt(match[1]) * 60 + parseInt(match[2])
    }
}

// 싱글톤 인스턴스
export const flightAggregator = new FlightAggregator()
