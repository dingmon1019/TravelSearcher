import { NextRequest, NextResponse } from 'next/server'
import { getCached, setCache, createCacheKey } from '@/lib/cache/redis'
import { flightAggregator } from '@/lib/services/flight-aggregator'
import { SearchParams, FlightOffer } from '@/lib/types/flight'
import { savePriceTrend, getSearchCache, saveSearchCache } from '@/lib/db/supabase'
import { z } from 'zod'

const searchSchema = z.object({
    from: z.string().min(1, "Origin is required").transform(s => s.split(',')),
    to: z.string().min(1, "Destination is required").transform(s => s.split(',')),
    tripType: z.enum(['oneway', 'round', 'multi']).default('round'),
    dep: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Departure date must be YYYY-MM-DD"),
    ret: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Return date must be YYYY-MM-DD").optional(),
    dates: z.string().optional().transform(s => s ? s.split(',') : []),
    adults: z.preprocess((val) => parseInt(val as string, 10), z.number().min(1).max(9)).default(1),
    sort: z.enum(['price', 'duration', 'departure']).default('price'),
    maxPrice: z.preprocess((val) => val ? parseInt(val as string, 10) : undefined, z.number().optional()),
    stops: z.preprocess((val) => val ? (val as string).split(',').map(s => parseInt(s, 10)) : undefined, z.array(z.number()).optional()),
    airlines: z.preprocess((val) => val ? (val as string).split(',') : undefined, z.array(z.string()).optional()),
})

export async function GET(request: NextRequest) {
    try {
        // 쿼리 파라미터 파싱 및 검증
        const { searchParams: rawParams } = request.nextUrl
        const queryObj = Object.fromEntries(rawParams.entries())
        
        const validation = searchSchema.safeParse(queryObj)
        
        if (!validation.success) {
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid parameters', 
                details: validation.error.format() 
            }, { status: 400 })
        }

        const data = validation.data
        const params: SearchParams = {
            from: data.from,
            to: data.to,
            tripType: data.tripType,
            depDate: data.dep,
            retDate: data.ret,
            adults: data.adults,
            sort: data.sort,
            maxPrice: data.maxPrice,
            stops: data.stops,
            airlines: data.airlines
        }

        // Multi-city segments 구성
        if (data.tripType === 'multi' && data.from.length > 0) {
            params.segments = data.from.map((from, i) => ({
                from: [from],
                to: [data.to[i] || ''],
                date: data.dates[i] || (i === 0 ? data.dep : '')
            }))
        }

        // 캐시 키 생성
        const cacheKey = createCacheKey('flight:search', {
            from: params.from,
            to: params.to,
            dep: params.depDate,
            ret: params.retDate,
            dates: data.dates,
            adults: params.adults,
            tripType: params.tripType
        })

        // 1. 캐시 확인 (Redis 우선, 그 다음 Supabase)
        let results: FlightOffer[] | null = await getCached(cacheKey)
        
        if (!results) {
            results = await getSearchCache(cacheKey)
        }

        if (results) {
            // 캐시된 결과 필터링 및 정렬
            const filtered = filterAndSortResults(results, params)
            
            // 파셋 데이터 생성 (필터 전 전체 결과 기준)
            const facets = {
                airlines: Array.from(new Set(results.map(f => f.airline))).sort(),
                maxPrice: results.length > 0 ? Math.max(...results.map(f => f.price)) : 3000000,
                stopCounts: Array.from(new Set(results.map(f => f.stopCount))).sort()
            }

            // [추가] 캐시된 결과라도 최저가 추이 업데이트 (통계 일관성 유지)
            if (results.length > 0) {
                const lowest = results[0]
                const route = `${params.from[0]}-${params.to[0]}`
                savePriceTrend({
                    route,
                    date: params.depDate || '',
                    price: lowest.price,
                    provider: lowest.provider,
                    is_weekend: [0, 6].includes(new Date(params.depDate || '').getDay())
                }).catch(e => console.error('[Background] Failed to update trend from cache:', e))
            }

            return NextResponse.json({
                success: true,
                data: filtered,
                facets,
                meta: {
                    cached: true,
                    totalResults: results.length,
                    filteredResults: filtered.length,
                    searchTime: 0,
                }
            })
        }

        // 2. 실제 검색
        const startTime = Date.now()
        results = await flightAggregator.searchAll(params)
        const searchTime = Date.now() - startTime

        // 3. 캐시 저장 (Redis & Supabase)
        if (results.length > 0) {
            await Promise.all([
                setCache(cacheKey, results, 300),
                saveSearchCache(cacheKey, results, new Date(Date.now() + 300 * 1000))
            ])
        }

        // 4. 비동기 백그라운드 데이터 저장 (통계용)
        if (results.length > 0) {
            const lowest = results[0]
            const route = `${params.from[0]}-${params.to[0]}`

            Promise.resolve().then(async () => {
                try {
                    await savePriceTrend({
                        route,
                        date: params.depDate || '',
                        price: lowest.price,
                        provider: lowest.provider,
                        is_weekend: [0, 6].includes(new Date(params.depDate || '').getDay())
                    })
                } catch (e) {
                    console.error('[Background] Failed to save price trend:', e)
                }
            })
        }

        const filtered = filterAndSortResults(results, params)

        // 파셋 데이터 생성 (필터 전 전체 결과 기준)
        const facets = {
            airlines: Array.from(new Set(results.map(f => f.airline))).sort(),
            maxPrice: results.length > 0 ? Math.max(...results.map(f => f.price)) : 3000000,
            stopCounts: Array.from(new Set(results.map(f => f.stopCount))).sort()
        }

        return NextResponse.json({
            success: true,
            data: filtered,
            facets,
            meta: {
                cached: false,
                totalResults: results.length,
                filteredResults: filtered.length,
                searchTime,
            }
        });
    } catch (error) {
        console.error('Search API Error:', error)
        return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
    }
}

/**
 * 결과 필터링 및 정렬 유틸리티
 */
function filterAndSortResults(results: FlightOffer[], params: SearchParams): FlightOffer[] {
    let filtered = [...results]

    // 필터 적용
    if (params.maxPrice) {
        filtered = filtered.filter(f => f.price <= params.maxPrice!)
    }
    if (params.stops && params.stops.length > 0) {
        filtered = filtered.filter(f => 
            params.stops!.some(s => {
                if (s === 2) return f.stopCount >= 2
                return f.stopCount === s
            })
        )
    }
    if (params.airlines && params.airlines.length > 0) {
        filtered = filtered.filter(f => params.airlines!.includes(f.airline))
    }

    // 정렬 적용 (이미 Aggregator에서 정렬되어 있을 수 있지만 다시 확인)
    const sortBy = params.sort || 'price'
    switch (sortBy) {
        case 'price':
            return filtered.sort((a, b) => a.price - b.price)
        case 'duration':
            return filtered.sort((a, b) => parseDuration(a.duration) - parseDuration(b.duration))
        case 'departure':
            return filtered.sort((a, b) => a.departureTime.localeCompare(b.departureTime))
        default:
            return filtered
    }
}

function parseDuration(duration: string): number {
    const match = duration.match(/(\d+)h\s*(\d+)m/)
    if (!match) return 0
    return parseInt(match[1]) * 60 + parseInt(match[2])
}
