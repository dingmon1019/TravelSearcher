import { BaseFlightAdapter } from './base'
import { SearchParams, FlightOffer } from '@/lib/types/flight'
import { AmadeusService } from '../services/amadeus-service'
import { CurrencyService } from '../services/currency'

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
            const token = await AmadeusService.getAccessToken()

            const fromCode = this.cleanCode(params.from[0])
            const toCode = this.cleanCode(params.to[0])

            if (!fromCode || !toCode) {
                console.warn(`[Amadeus] Skipping search due to invalid IATA codes: ${params.from[0]} -> ${params.to[0]}`)
                return []
            }

            if (params.tripType === 'multi' && params.segments && params.segments.length > 0) {
                return this.searchMultiCity(params, token, baseUrl)
            }

            console.log(`[Amadeus] Starting search for ${params.from[0]} -> ${params.to[0]} using ${baseUrl}`)
            console.log(`[Amadeus] Token acquired. Requesting flight offers for ${fromCode} -> ${toCode}`)

            // 파라미터 구성
            // Test 환경에서는 KRW 요청이 불안정할 수 있으므로 EUR로 요청 후 변환하는 것이 안전함
            const query = new URLSearchParams({
                originLocationCode: fromCode,
                destinationLocationCode: toCode,
                departureDate: params.depDate || '',
                adults: params.adults.toString(),
                max: '20',
                currencyCode: 'EUR' 
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
            const offers = await this.mapToFlightOffers(data, params)
            console.log(`[Amadeus] Successfully mapped ${offers.length} offers`)
            return offers
        }, [], { timeout: 10000, retries: 2 })
    }

    private async searchMultiCity(params: SearchParams, token: string, baseUrl: string): Promise<FlightOffer[]> {
        console.log(`[Amadeus] Starting multi-city search with ${params.segments?.length} segments`)

        const originDestinations = params.segments?.map((seg, index) => {
            const from = this.cleanCode(seg.from[0])
            const to = this.cleanCode(seg.to[0])
            if (!from || !to) throw new Error(`Invalid IATA codes in segment ${index + 1}`)
            
            return {
                id: (index + 1).toString(),
                originLocationCode: from,
                destinationLocationCode: to,
                departureDateTimeRange: {
                    date: seg.date
                }
            }
        }) || []

        const travelers = Array.from({ length: params.adults }, (_, i) => ({
            id: (i + 1).toString(),
            travelerType: 'ADULT'
        }))

        const body = {
            currencyCode: 'EUR',
            originDestinations,
            travelers,
            sources: ['GDS']
        }

        const url = `${baseUrl}/shopping/flight-offers`
        console.log(`[Amadeus] POST Fetching: ${url}`)

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            console.error(`[Amadeus] Multi-city API Error ${response.status}:`, JSON.stringify(errorBody))
            throw new Error(`Amadeus Multi-city API Error: ${response.status}`)
        }

        const data = await response.json()
        return this.mapToFlightOffers(data, params)
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
    private async mapToFlightOffers(data: { data?: any[]; dictionaries?: any }, params: SearchParams): Promise<FlightOffer[]> {
        if (!data || !data.data) return []

        const dictionary = data.dictionaries || {}
        const rates = await CurrencyService.getKRWRates();

        return data.data.map((offer: any): FlightOffer => {
            const itinerary = offer.itineraries[0]
            const firstSegment = itinerary.segments[0]
            const lastSegment = itinerary.segments[itinerary.segments.length - 1]

            const airlineCode = firstSegment.carrierCode
            const airlineName = dictionary.carriers?.[airlineCode] || airlineCode

            // 안전한 가격 파싱 및 통화 변환
            const rawPrice = offer.price?.total ? parseFloat(offer.price.total) : 0
            const currency = offer.price?.currency || 'EUR' // Amadeus Test는 주로 EUR

            // 동적 환율 적용
            let priceValue = rawPrice
            if (currency !== 'KRW') {
                const rate = rates[currency] || 1;
                priceValue = rawPrice * rate;
            }

            if (offer.id === data.data![0].id) {
                console.log(`[Amadeus] Mapping first offer: ${currency} ${rawPrice} -> ≈${Math.floor(priceValue)} KRW (Rate: ${rates[currency] || 'N/A'})`)
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
                deepLink: offer.id ? `https://www.amadeus.net/sl/flights?origin=${firstSegment.departure.iataCode}&destination=${lastSegment.arrival.iataCode}&departureDate=${firstSegment.departure.at.split('T')[0]}` : '#'
            }

            // 모든 여정 정보를 legs에 담기 (다구간 지원)
            if (offer.itineraries && offer.itineraries.length > 0) {
                result.legs = offer.itineraries.map((itin: any) => {
                    const first = itin.segments[0]
                    const last = itin.segments[itin.segments.length - 1]
                    return {
                        airline: dictionary.carriers?.[first.carrierCode] || first.carrierCode,
                        flightNumber: `${first.carrierCode}${first.number}`,
                        departureTime: first.departure.at.split('T')[1].substring(0, 5),
                        arrivalTime: last.arrival.at.split('T')[1].substring(0, 5),
                        origin: dictionary.locations?.[first.departure.iataCode]?.cityCode || first.departure.iataCode,
                        originCode: first.departure.iataCode,
                        destination: dictionary.locations?.[last.arrival.iataCode]?.cityCode || last.arrival.iataCode,
                        destinationCode: last.arrival.iataCode,
                        duration: this.formatDuration(itin.duration),
                        stopCount: itin.segments.length - 1,
                        departureDate: first.departure.at.split('T')[0],
                    }
                })

                // 왕복인 경우 backward compatibility 유지
                if (result.legs && result.legs.length > 1) {
                    result.returnInfo = result.legs[1]
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
