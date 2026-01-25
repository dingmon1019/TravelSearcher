import { NextRequest, NextResponse } from 'next/server'
import { getCached, setCache, createCacheKey } from '@/lib/cache/redis'
import { flightAggregator } from '@/lib/services/flight-aggregator'
import { SearchParams } from '@/lib/types/flight'

export async function GET(request: NextRequest) {
    try {
        // 쿼리 파라미터 파싱
        const searchParams = request.nextUrl.searchParams
        const params: SearchParams = {
            from: searchParams.get('from')?.split(',') || [],
            to: searchParams.get('to')?.split(',') || [],
            tripType: (searchParams.get('tripType') as 'oneway' | 'round') || 'round',
            depDate: searchParams.get('dep') || '',
            retDate: searchParams.get('ret') || undefined,
            sort: (searchParams.get('sort') as 'price' | 'duration' | 'departure') || 'price',
        }

        // 캐시 키 생성
        const cacheKey = createCacheKey('flight:search', params)

        // 1. 캐시 확인
        const cached = await getCached(cacheKey)
        if (cached) {
            return NextResponse.json({
                success: true,
                data: cached,
                meta: {
                    cached: true,
                    providers: ['Cache'],
                    searchTime: 0,
                }
            })
        }

        // 2. 실제 검색
        const startTime = Date.now()
        const results = await flightAggregator.searchAll(params)
        const searchTime = Date.now() - startTime

        // 3. 캐시 저장 (5분)
        await setCache(cacheKey, results, 300)

        return NextResponse.json({
            success: true,
            data: results,
            meta: {
                cached: false,
                totalResults: results.length,
                providers: ['Mock'],
                searchTime,
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
    }
}
