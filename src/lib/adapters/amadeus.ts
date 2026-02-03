import { BaseFlightAdapter } from './base'
import { SearchParams, FlightOffer } from '@/lib/types/flight'
import { AmadeusService } from '../services/amadeus-service'

/**
 * Amadeus API 어댑터
 */
export class AmadeusAdapter extends BaseFlightAdapter {
    name = 'Amadeus'
    private getBaseUrl() {
        return process.env.AMADEUS_ENV === 'production'
            ? 'https://api.amadeus.com/v2'
            : 'https://test.api.amadeus.com/v2'
    }

    async search(params: SearchParams): Promise<FlightOffer[]> {
        return this.safeExecute(async () => {
            const baseUrl = this.getBaseUrl()
            console.log(`[Amadeus] Starting search for ${params.from[0]} -> ${params.to[0]} using ${baseUrl}`)

            const fromCode = this.cleanCode(params.from[0])
            const toCode = this.cleanCode(params.to[0])

            if (!fromCode || !toCode) {
                console.warn(`[Amadeus] Skipping search due to invalid IATA codes: from=${params.from[0]}, to=${params.to[0]}`)
                return []
            }

            const token = await AmadeusService.getAccessToken()
            console.log(`[Amadeus] Token acquired. Requesting flight offers for ${fromCode} -> ${toCode}`)

            // 파라미터 구성
            const query = new URLSearchParams({
                originLocationCode: fromCode,
                destinationLocationCode: toCode,
                departureDate: params.depDate || '',
                adults: params.adults.toString(),
                max: '20',
                currencyCode: 'KRW'
            })

            if (params.tripType === 'round' && params.retDate) {
                query.append('returnDate', params.retDate)
            }

            const url = `${baseUrl}/shopping/flight-offers?${query.toString()}`
            console.log(`[Amadeus] Fetching: ${url}`)

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                console.error(`[Amadeus] API Error ${response.status}:`, JSON.stringify(errorBody))

                // 상세 에러 추출
                const detail = errorBody?.errors?.[0]?.detail || ''
                if (detail.toLowerCase().includes('departure date') || detail.toLowerCase().includes('ticketing date')) {
                    throw new Error(`Invalid Date: 과거 날짜나 너무 임박한 날짜는 검색할 수 없습니다. (Detail: ${detail})`)
                }

                throw new Error(`Amadeus API Error: ${response.status}`)
            }

            const data = await response.json()
            if (data.data && data.data.length > 0) {
                console.log(`[Amadeus] Found ${data.data.length} offers. First offer currency: ${data.data[0].price.currency}`)
            }
            const offers = this.mapToFlightOffers(data, params)
            console.log(`[Amadeus] Successfully mapped ${offers.length} offers`)
            return offers
        }, [], { timeout: 10000, retries: 2 })
    }

    private cleanCode(code: string): string | null {
        if (!code) return null

        // region-jp, island-jeju 등 지역/그룹은 Amadeus IATA 검색에서 제외
        if (code.startsWith('region-') || code.startsWith('island-')) {
            return null
        }

        // city-icn -> ICN, icn -> ICN
        let part = code
        if (code.includes('-')) {
            const parts = code.split('-')
            // prefix가 city인 경우에만 마지막 파트를 IATA로 간주
            if (parts[0] === 'city') {
                part = parts.pop() || ''
            } else {
                return null // 그 외 하이픈 포함된 코드는 무시
            }
        }

        const cleanPart = part.toUpperCase()
        if (cleanPart.length === 3) {
            return cleanPart
        }

        return null
    }

    /**
     * Amadeus 응답을 공통 형식으로 변환
     */
    private mapToFlightOffers(data: { data?: any[]; dictionaries?: any }, params: SearchParams): FlightOffer[] {
        if (!data || !data.data) return []

        const dictionary = data.dictionaries || {}

        return data.data.map((offer: any): FlightOffer => {
            const itinerary = offer.itineraries[0]
            const firstSegment = itinerary.segments[0]
            const lastSegment = itinerary.segments[itinerary.segments.length - 1]

            const airlineCode = firstSegment.carrierCode
            const airlineName = dictionary.carriers?.[airlineCode] || airlineCode

            // 안전한 가격 파싱 및 통화 변환
            const rawPrice = offer.price?.total ? parseFloat(offer.price.total) : 0
            const currency = offer.price?.currency || 'EUR' // Amadeus Test는 주로 EUR

            // 대략적인 환율 적용 (실제 서비스에서는 외부 환율 API 연동 필요)
            let priceValue = rawPrice
            if (currency === 'EUR') priceValue = rawPrice * 1450 // EUR -> KRW
            else if (currency === 'USD') priceValue = rawPrice * 1350 // USD -> KRW

            if (offer.id === data.data![0].id) {
                console.log(`[Amadeus] Mapping first offer: ${currency} ${rawPrice} -> ≈${Math.floor(priceValue)} KRW`)
            }

            const result: FlightOffer = {
                id: `amadeus-${offer.id}`,
                airline: airlineName,
                flightNumber: `${airlineCode}${firstSegment.number}`,
                departureTime: firstSegment.departure.at.split('T')[1].substring(0, 5),
                arrivalTime: lastSegment.arrival.at.split('T')[1].substring(0, 5),
                origin: dictionary.locations?.[firstSegment.departure.iataCode]?.cityCode || firstSegment.departure.iataCode,
                originCode: firstSegment.departure.iataCode,
                destination: dictionary.locations?.[lastSegment.arrival.iataCode]?.cityCode || lastSegment.arrival.iataCode,
                destinationCode: lastSegment.arrival.iataCode,
                duration: this.formatDuration(itinerary.duration),
                price: Math.floor(priceValue), // KRW 기준 변환값
                stopCount: itinerary.segments.length - 1,
                departureDate: firstSegment.departure.at.split('T')[0],
                provider: 'Amadeus',
                deepLink: `https://www.amadeus.com` // 실제 구현시 상세 링크 생성 로직 필요
            }

            // 왕복인 경우
            if (offer.itineraries.length > 1) {
                const retItinerary = offer.itineraries[1]
                const retFirst = retItinerary.segments[0]
                const retLast = retItinerary.segments[retItinerary.segments.length - 1]

                result.returnInfo = {
                    airline: dictionary.carriers?.[retFirst.carrierCode] || retFirst.carrierCode,
                    flightNumber: `${retFirst.carrierCode}${retFirst.number}`,
                    departureTime: retFirst.departure.at.split('T')[1].substring(0, 5),
                    arrivalTime: retLast.arrival.at.split('T')[1].substring(0, 5),
                    origin: result.destination,
                    originCode: result.destinationCode,
                    destination: result.origin,
                    destinationCode: result.originCode,
                    duration: this.formatDuration(retItinerary.duration),
                    stopCount: retItinerary.segments.length - 1,
                    departureDate: retFirst.departure.at.split('T')[0],
                }
            }

            return result
        })
    }

    /**
     * PT2H30M 형식을 2h 30m 형식으로 변환
     */
    private formatDuration(duration: string): string {
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
        if (!match) return duration
        const h = match[1] ? `${match[1]}h ` : ''
        const m = match[2] ? `${match[2]}m` : '0m'
        return (h + m).trim()
    }
}
