import { FlightOffer, SearchParams } from '../types/flight';
import { LocationService } from './location-service';

export class FlightService {
    private static airlines = ['제주항공', '대한항공', '아시아나', '진에어', '티웨이', '피치항공', '비엣젯', '에어부산'];
    private static providers = ['Trip.com', 'Naver', 'Skyscanner'] as const;

    static async search(params: SearchParams): Promise<FlightOffer[]> {
        const origins = await LocationService.resolveLocations(params.from);
        const destinations = await LocationService.resolveLocations(params.to);

        // Simulation delay
        await new Promise(resolve => setTimeout(resolve, 600));

        const results: FlightOffer[] = [];
        const baseDate = params.depDate || new Date().toISOString().split('T')[0];

        // Generate dynamic mock data based on multi-route combinations
        origins.forEach(originId => {
            destinations.forEach(destId => {
                // Skip if same
                if (originId === destId) return;

                const originCode = originId.replace('city-', '').replace('region-', '').substring(0, 3).toUpperCase();
                const destinationCode = destId.replace('city-', '').replace('region-', '').substring(0, 3).toUpperCase();

                // Create 2-4 offers per route
                const count = Math.floor(Math.random() * 3) + 2;
                for (let i = 0; i < count; i++) {
                    const airline = this.airlines[Math.floor(Math.random() * this.airlines.length)];
                    const provider = this.providers[Math.floor(Math.random() * this.providers.length)];

                    // Stop count logic: 70% direct, 20% 1-stop, 10% 2+ stops
                    const rand = Math.random();
                    const stopCount = rand < 0.7 ? 0 : rand < 0.9 ? 1 : 2;

                    // Logic for price and duration based on stops
                    let basePrice = 150000;
                    if (destId.includes('cdg') || destId.includes('lhr') || destId.includes('jfk')) basePrice = 900000;
                    else if (destId.includes('dad') || destId.includes('bkk')) basePrice = 250000;

                    let totalPrice = basePrice + Math.floor(Math.random() * basePrice * 0.5);
                    totalPrice += stopCount * 50000; // Extra cost or different logic, here just add small amount

                    const getDuration = (stops: number) => {
                        if (stops === 0) return '2h 30m';
                        if (stops === 1) return '12h 45m';
                        return '24h 15m';
                    };

                    let returnInfo;
                    if (params.retDate) {
                        const retAirline = this.airlines[Math.floor(Math.random() * this.airlines.length)];
                        totalPrice *= 1.8;
                        const retStopCount = Math.random() < 0.7 ? 0 : 1;
                        returnInfo = {
                            airline: retAirline,
                            flightNumber: `${retAirline.substring(0, 2)}${Math.floor(Math.random() * 900) + 100}`,
                            departureDate: params.retDate,
                            departureTime: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                            arrivalTime: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                            origin: destinationCode,
                            originCode: destinationCode,
                            destination: originCode,
                            destinationCode: originCode,
                            duration: getDuration(retStopCount),
                            stopCount: retStopCount,
                        };
                    }

                    results.push({
                        id: `f-${originId}-${destId}-${i}-${Math.random().toString(36).substr(2, 5)}`,
                        airline,
                        flightNumber: `${airline.substring(0, 2)}${Math.floor(Math.random() * 900) + 100}`,
                        departureDate: baseDate,
                        departureTime: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                        arrivalTime: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                        origin: originCode,
                        originCode: originCode,
                        destination: destinationCode,
                        destinationCode: destinationCode,
                        duration: getDuration(stopCount),
                        price: Math.floor(totalPrice / 100) * 100,
                        stopCount,
                        provider,
                        deepLink: '#',
                        returnInfo
                    });
                }
            });
        });

        // Apply sorting
        if (params.sort === 'price') {
            results.sort((a, b) => a.price - b.price);
        } else if (params.sort === 'duration') {
            results.sort((a, b) => a.duration.localeCompare(b.duration)); // Simple string sort for mock
        } else if (params.sort === 'departure') {
            results.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
        } else {
            // Default: Price
            results.sort((a, b) => a.price - b.price);
        }

        return results;
    }
}
