import { BaseFlightAdapter } from './base'
import { SearchParams, FlightOffer } from '@/lib/types/flight'

/**
 * Mock 어댑터 - 테스트 및 개발용
 */
export class MockFlightAdapter extends BaseFlightAdapter {
    name = 'Mock Provider'

    async search(params: SearchParams): Promise<FlightOffer[]> {
        // 기존 FlightService 로직 재사용
        await new Promise(resolve => setTimeout(resolve, 500)) // 네트워크 지연 시뮬레이션

        const airlines = ['대한항공', '아시아나항공', '진에어', '제주항공', 'ANA', 'JAL']
        const count = Math.floor(Math.random() * 10) + 5

        const results: FlightOffer[] = []

        for (let i = 0; i < count; i++) {
            const airline = airlines[Math.floor(Math.random() * airlines.length)]
            const stopCount = Math.random() < 0.7 ? 0 : Math.random() < 0.9 ? 1 : 2

            let basePrice = 150000
            if (params.to.some(dest => dest.includes('cdg') || dest.includes('lhr') || dest.includes('jfk'))) {
                basePrice = 900000
            } else if (params.to.some(dest => dest.includes('dad') || dest.includes('bkk'))) {
                basePrice = 250000
            }

            const totalPrice = basePrice + Math.floor(Math.random() * basePrice * 0.5) + stopCount * 50000

            const getDuration = (stops: number) => {
                if (stops === 0) return '2h 30m'
                if (stops === 1) return '12h 45m'
                return '24h 15m'
            }

            const offer: FlightOffer = {
                id: `mock-${i}-${Date.now()}`,
                airline,
                flightNumber: `${airline.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 900) + 100}`,
                departureTime: `${String(Math.floor(Math.random() * 12) + 6).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                arrivalTime: `${String(Math.floor(Math.random() * 12) + 12).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                origin: '서울/인천',
                originCode: params.from[0] || 'ICN',
                destination: '도쿄/나리타',
                destinationCode: params.to[0] || 'NRT',
                duration: getDuration(stopCount),
                price: totalPrice,
                stopCount,
                departureDate: params.depDate || '',
                provider: 'Mock',
                deepLink: `https://example.com/flight/${i}`,
                aircraft: 'Boeing 787-9 Dreamliner',
                baggage: '위탁수하물 1개(23kg)',
                layovers: stopCount > 0 ? [
                    { airport: 'TPE', duration: '2h 15m' }
                ] : undefined
            }

            // 왕복인 경우
            if (params.tripType === 'round' && params.retDate) {
                offer.returnInfo = {
                    airline,
                    flightNumber: `${airline.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 900) + 100}`,
                    departureTime: `${String(Math.floor(Math.random() * 12) + 6).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                    arrivalTime: `${String(Math.floor(Math.random() * 12) + 12).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                    origin: offer.destination,
                    originCode: offer.destinationCode,
                    destination: offer.origin,
                    destinationCode: offer.originCode,
                    duration: getDuration(stopCount),
                    stopCount,
                    departureDate: params.retDate,
                    aircraft: 'Boeing 787-9 Dreamliner',
                    baggage: '위탁수하물 1개(23kg)',
                    layovers: stopCount > 0 ? [
                        { airport: 'TPE', duration: '1h 45m' }
                    ] : undefined
                }
            }

            results.push(offer)
        }

        // 정렬
        if (params.sort === 'price') {
            results.sort((a, b) => a.price - b.price)
        }

        return results
    }
}
