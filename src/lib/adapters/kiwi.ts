import { BaseFlightAdapter } from './base'
import { SearchParams, FlightOffer, FlightLeg } from '@/lib/types/flight'

/**
 * Kiwi (Tequila) API 어댑터
 */
export class KiwiAdapter extends BaseFlightAdapter {
    name = 'Kiwi'
    private baseUrl = 'https://tequila-api.kiwi.com/v2'

    async search(params: SearchParams): Promise<FlightOffer[]> {
        return this.safeExecute(async () => {
            const apiKey = process.env.KIWI_API_KEY
            if (!apiKey) {
                console.warn('[Kiwi] API Key missing, skipping search')
                return []
            }

            // 날짜 형식 변환 (YYYY-MM-DD -> DD/MM/YYYY)
            const formatDate = (dateStr: string) => {
                const [y, m, d] = dateStr.split('-')
                return `${d}/${m}/${y}`
            }

            const query = new URLSearchParams({
                fly_from: params.from[0],
                fly_to: params.to[0],
                date_from: formatDate(params.depDate || ''),
                date_to: formatDate(params.depDate || ''),
                adults: params.adults.toString(),
                curr: 'KRW',
                limit: '20'
            })

            if (params.tripType === 'round' && params.retDate) {
                query.append('return_from', formatDate(params.retDate))
                query.append('return_to', formatDate(params.retDate))
            }

            const url = `${this.baseUrl}/search?${query.toString()}`
            
            const response = await fetch(url, {
                headers: { 'apikey': apiKey }
            })

            if (!response.ok) {
                throw new Error(`Kiwi API Error: ${response.status}`)
            }

            const data = await response.json()
            return this.mapToFlightOffers(data.data, params)
        }, [])
    }

    private mapToFlightOffers(data: any[], params: SearchParams): FlightOffer[] {
        if (!data) return []

        return data.map((offer: any): FlightOffer => {
            const departure = offer.route[0]
            const arrival = offer.route[offer.route.length - 1]

            const result: FlightOffer = {
                id: `kiwi-${offer.id}`,
                airline: offer.airlines.join(', '),
                flightNumber: `${offer.airlines[0]}${departure.flight_no}`,
                departureTime: new Date(departure.local_departure).toTimeString().substring(0, 5),
                arrivalTime: new Date(arrival.local_arrival).toTimeString().substring(0, 5),
                origin: offer.cityFrom,
                originCode: offer.flyFrom,
                destination: offer.cityTo,
                destinationCode: offer.flyTo,
                duration: this.formatDuration(offer.duration.departure),
                price: offer.price,
                stopCount: offer.route.filter((r: any) => r.return === 0).length - 1,
                departureDate: departure.local_departure.split('T')[0],
                provider: 'Kiwi',
                deepLink: offer.deep_link
            }

            // 왕복 처리
            const returnRoute = offer.route.filter((r: any) => r.return === 1)
            if (returnRoute.length > 0) {
                const retDep = returnRoute[0]
                const retArr = returnRoute[returnRoute.length - 1]
                result.returnInfo = {
                    airline: offer.airlines.join(', '),
                    flightNumber: `${offer.airlines[0]}${retDep.flight_no}`,
                    departureTime: new Date(retDep.local_departure).toTimeString().substring(0, 5),
                    arrivalTime: new Date(retArr.local_arrival).toTimeString().substring(0, 5),
                    origin: offer.cityTo,
                    originCode: offer.flyTo,
                    destination: offer.cityFrom,
                    destinationCode: offer.flyFrom,
                    duration: this.formatDuration(offer.duration.return),
                    stopCount: returnRoute.length - 1,
                    departureDate: retDep.local_departure.split('T')[0]
                }
            }

            return result
        })
    }

    private formatDuration(seconds: number): string {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        return `${h}h ${m}m`
    }
}
