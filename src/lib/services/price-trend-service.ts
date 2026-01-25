import { DayPriceTrend, SearchParams } from '../types/flight';
import { LocationService } from './location-service';

export class PriceTrendService {
    static async getTrends(params: SearchParams): Promise<DayPriceTrend[]> {
        // Typically trends are for a specific city pair or region
        // For simplicity, we'll take the first origin and first destination
        const origins = await LocationService.resolveLocations(params.from);
        const destinations = await LocationService.resolveLocations(params.to);

        if (origins.length === 0 || destinations.length === 0) return [];

        const trends: DayPriceTrend[] = [];
        const startDate = new Date(); // Start from today
        startDate.setMonth(startDate.getMonth() - 2); // Show from 2 months ago

        // Generate 120 days of data (approx 4 months)
        for (let i = 0; i < 150; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const dateStr = date.toISOString().split('T')[0];
            const day = date.getDay();
            const isWeekend = day === 0 || day === 6;

            // Random price with weekend logic
            const basePrice = 180000;
            const fluctuation = Math.sin(i / 10) * 50000 + (Math.random() * 30000);
            const price = basePrice + fluctuation + (isWeekend ? 40000 : 0);

            trends.push({
                date: dateStr,
                price: Math.floor(price / 100) * 100,
                isWeekend
            });
        }

        return trends;
    }
}
