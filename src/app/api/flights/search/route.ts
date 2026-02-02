import { NextRequest, NextResponse } from 'next/server'
import { getCached, setCache, createCacheKey } from '@/lib/cache/redis'
import { flightAggregator } from '@/lib/services/flight-aggregator'
import { SearchParams, FlightOffer } from '@/lib/types/flight'
import { savePriceTrend } from '@/lib/db/supabase'

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
            adults: parseInt(searchParams.get('adults') || '1'),
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

        // 4. 비동기 백그라운드 데이터 저장 (통계용) - 응답을 기다리지 않음
        if (results.length > 0) {
            const lowest = results[0]
            const route = `${params.from[0]}-${params.to[0]}`

            // Fire and forget
            Promise.resolve().then(async () => {
                try {
                    await savePriceTrend({
                        route,
                        date: params.depDate || '',
                        price: lowest.price,
                        provider: lowest.provider,
                        is_weekend: [0, 6].includes(new Date(params.depDate || '').getDay())
                    })
                    console.log(`[Background] Saved price trend for ${route}`)
                } catch (e) {
                    console.error('[Background] Failed to save price trend:', e)
                }
            })
        }

        return NextResponse.json({
            success: true,
            data: results,
            meta: {
                cached: false,
                totalResults: results.length,
                searchTime,
            }
        });
    } catch (error) {
        console.error('Search API Error:', error)
        return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
    }
}
