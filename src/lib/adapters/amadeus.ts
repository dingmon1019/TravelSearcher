import { BaseFlightAdapter } from './base'
import { SearchParams, FlightOffer } from '@/lib/types/flight'

/**
 * Amadeus API 어댑터
 */
export class AmadeusAdapter extends BaseFlightAdapter {
    name = 'Amadeus'
    private baseUrl = 'https://test.api.amadeus.com/v2' // 테스트 환경, 실 운영시 https://api.amadeus.com/v2
    private token: string | null = null
    private tokenExpiresAt: number = 0

    /**
     * OAuth2 토큰 획득
     */
    private async getAccessToken(): Promise<string> {
        if (this.token && Date.now() < this.tokenExpiresAt) {
            return this.token
        }

        const clientId = process.env.AMADEUS_CLIENT_ID
        const clientSecret = process.env.AMADEUS_CLIENT_SECRET

        if (!clientId || !clientSecret) {
            throw new Error('Amadeus API credentials missing')
        }

        const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
        })

        const data = await response.json()
        this.token = data.access_token
        this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000 // 1분 전 만료 처리
        return this.token!
    }

    async search(params: SearchParams): Promise<FlightOffer[]> {
        return this.safeExecute(async () => {
            const token = await this.getAccessToken()

            // 파라미터 구성
            const query = new URLSearchParams({
                originLocationCode: params.from[0],
                destinationLocationCode: params.to[0],
                departureDate: params.depDate || '',
                adults: params.adults.toString(),
                max: '20',
                currencyCode: 'KRW'
            })

            if (params.tripType === 'round' && params.retDate) {
                query.append('returnDate', params.retDate)
            }

            const response = await fetch(`${this.baseUrl}/shopping/flight-offers?${query.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(`Amadeus API Error: ${JSON.stringify(error)}`)
            }

            const data = await response.json()
            return this.mapToFlightOffers(data, params)
        }, [])
    }

    /**
     * Amadeus 응답을 공통 형식으로 변환
     */
    private mapToFlightOffers(data: any, params: SearchParams): FlightOffer[] {
        if (!data || !data.data) return []

        const dictionary = data.dictionaries || {}

        return data.data.map((offer: any): FlightOffer => {
            const itinerary = offer.itineraries[0]
            const firstSegment = itinerary.segments[0]
            const lastSegment = itinerary.segments[itinerary.segments.length - 1]

            const airlineCode = firstSegment.carrierCode
            const airlineName = dictionary.carriers?.[airlineCode] || airlineCode

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
                price: Math.floor(parseFloat(offer.price.total)), // KRW 기준
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
