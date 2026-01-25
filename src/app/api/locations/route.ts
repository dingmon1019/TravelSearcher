import { NextRequest, NextResponse } from 'next/server';
import { LocationService } from '@/lib/services/location-service';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    try {
        const locations = await LocationService.search(query);
        return NextResponse.json({
            success: true,
            data: locations
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch locations' }, { status: 500 });
    }
}
