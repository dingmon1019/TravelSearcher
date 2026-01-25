export type LocationType = 'city' | 'group';

export interface LocationOption {
    id: string;
    type: LocationType;
    label: string;
    sub: string;
    keywords?: string[]; // For search enhancement
}

export type ProviderType = 'Trip.com' | 'Naver' | 'Skyscanner' | 'Mock';

export interface FlightOffer {
    id: string;
    airline: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    origin: string;
    originCode: string; // Added for UI
    destination: string;
    destinationCode: string; // Added for UI
    duration: string;
    departureDate: string; // Added for leg-specific dates
    price: number;
    stopCount: number; // 0 for direct, 1+ for stops
    provider: ProviderType;
    deepLink: string;
    // Round trip support
    returnInfo?: {
        airline: string;
        flightNumber: string;
        departureTime: string;
        arrivalTime: string;
        origin: string;
        originCode: string;
        destination: string;
        destinationCode: string;
        duration: string;
        departureDate: string; // Added for return leg
        stopCount: number;
    };
}

export interface SearchParams {
    from: string[];
    to: string[];
    tripType?: 'oneway' | 'round';
    depDate?: string;
    retDate?: string;
    sort?: 'price' | 'duration' | 'departure';
}

export interface DayPriceTrend {
    date: string;
    price: number;
    isWeekend: boolean;
}
