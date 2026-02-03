import { NextRequest, NextResponse } from 'next/server'
import { LocationService } from '@/lib/services/location-service'
import { LocationOption } from '@/lib/types/flight'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') // 'departure', 'destination'
        const query = searchParams.get('q') // 검색어

        let locations: LocationOption[] = []

        if (query) {
            // 키워드 검색 (Amadeus 연동 예정)
            locations = await LocationService.search(query)
        } else if (type === 'departure') {
            // 출발지 기본: 한국 도시들
            locations = await LocationService.getDepartures()
        } else if (type === 'destination') {
            // 도착지 기본: 인기 목적지/그룹
            locations = await LocationService.getDestinations()
        } else {
            // 전체 목록
            locations = await LocationService.getAll()
        }

        return NextResponse.json({
            success: true,
            data: locations
        })
    } catch (error) {
        console.error('Location API Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch locations' },
            { status: 500 }
        )
    }
}
