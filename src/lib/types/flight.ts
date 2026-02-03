export type LocationType = 'city' | 'group';

export interface LocationOption {
    id: string;
    type: LocationType;
    label: string;
    sub: string;
    keywords?: string[]; // For search enhancement
}

export type ProviderType = 'Trip.com' | 'Naver' | 'Skyscanner' | 'Mock' | 'Amadeus';

export interface FlightLeg {
    airline: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    origin: string;
    originCode: string;
    destination: string;
    destinationCode: string;
    duration: string;
    departureDate: string;
    stopCount: number;
    aircraft?: string;
    baggage?: string;
    layovers?: Array<{
        airport: string;
        duration: string;
    }>;
}

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
    // Extended info for Details View
    aircraft?: string;
    baggage?: string;
    layovers?: Array<{
        airport: string;
        duration: string;
    }>;
    // Support for multiple segments (Multi-city)
    legs?: FlightLeg[];
    // Round trip support
    returnInfo?: FlightLeg;
}

export interface FlightSegment {
    from: string[];
    to: string[];
    date: string;
}

export interface SearchParams {
    from: string[];
    to: string[];
    tripType?: 'oneway' | 'round' | 'multi';
    depDate?: string;
    retDate?: string;
    segments?: FlightSegment[];
    adults: number;
    sort?: 'price' | 'duration' | 'departure';
    // Filters
    maxPrice?: number;
    stops?: number[];
    airlines?: string[];
}

export interface DayPriceTrend {
    date: string;
    price: number;
    isWeekend: boolean;
}
