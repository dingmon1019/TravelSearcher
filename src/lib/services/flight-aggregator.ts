import { SearchParams, FlightOffer } from '@/lib/types/flight'
import { FlightProviderAdapter } from '@/lib/adapters/base'
import { MockFlightAdapter } from '@/lib/adapters/mock'
import { AmadeusAdapter } from '@/lib/adapters/amadeus'
import { KiwiAdapter } from '@/lib/adapters/kiwi'

/**
 * 항공권 검색 집계 서비스
 * 여러 제공업체로부터 결과를 수집하고 병합
 */
export class FlightAggregator {
    private adapters: FlightProviderAdapter[] = []
    private initialized = false

    constructor(adapters?: FlightProviderAdapter[]) {
        if (adapters) {
            this.adapters = adapters
            this.initialized = true
        }
    }

    private ensureAdapters() {
        if (this.initialized) return

        console.log(`[Aggregator] Configuring adapters. Env AMADEUS_CLIENT_ID: ${!!process.env.AMADEUS_CLIENT_ID}`)

        // 환경 변수가 있으면 Amadeus 추가
        if (process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET) {
            console.log('[Aggregator] Adding AmadeusAdapter')
            this.adapters.push(new AmadeusAdapter())
        }

        // Kiwi 어댑터 추가
        if (process.env.KIWI_API_KEY) {
            console.log('[Aggregator] Adding KiwiAdapter')
            this.adapters.push(new KiwiAdapter())
        }

        // Mock 데이터 어댑터 제거 (실제 결과만 조회하도록 강제)
        // this.adapters.push(new MockFlightAdapter())

        this.initialized = true
    }

    /**
     * 모든 제공업체에서 병렬로 검색
     */
    async searchAll(params: SearchParams): Promise<FlightOffer[]> {
        this.ensureAdapters()
        console.log(`[Aggregator] Searching with: ${this.adapters.map(a => a.name).join(', ')}`)
        
        const startTime = Date.now()
        // Promise.allSettled로 일부 실패해도 계속 진행
        const results = await Promise.allSettled(
            this.adapters.map(async adapter => {
                const adapterStart = Date.now()
                try {
                    const offers = await this.searchWithTimeout(adapter, params, 10000)
                    console.log(`[Aggregator] ${adapter.name} found ${offers.length} offers in ${Date.now() - adapterStart}ms`)
                    return offers
                } catch (err) {
                    console.error(`[Aggregator] ${adapter.name} failed:`, err)
                    throw err
                }
            })
        )

        // 성공한 결과만 수집
        const allOffers = results
            .filter((result): result is PromiseFulfilledResult<FlightOffer[]> =>
                result.status === 'fulfilled'
            )
            .flatMap(result => result.value)

        console.log(`[Aggregator] Total raw offers: ${allOffers.length} from all providers`)

        // 중복 제거 (같은 항공편)
        const uniqueOffers = this.deduplicateOffers(allOffers)
        console.log(`[Aggregator] Unique offers: ${uniqueOffers.length}`)

        // 정렬
        const sorted = this.sortOffers(uniqueOffers, params.sort || 'price')
        if (sorted.length > 0) {
            console.log(`[Aggregator] Lowest price found: ${sorted[0].price} KRW via ${sorted[0].provider}`)
        }

        console.log(`[Aggregator] Total search time: ${Date.now() - startTime}ms`)
        return sorted
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
