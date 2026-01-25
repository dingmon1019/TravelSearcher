import { NextRequest, NextResponse } from 'next/server'
import { getCached, setCache, createCacheKey } from '@/lib/cache/redis'
import { getPriceTrends } from '@/lib/db/supabase'
import { DayPriceTrend } from '@/lib/types/flight'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const from = searchParams.get('from') || 'ICN'
        const to = searchParams.get('to') || 'NRT'
        const route = `${from}-${to}`

        // 캐시 키 생성
        const cacheKey = createCacheKey('flight:trends', { route })

        // 1. 캐시 확인
        const cached = await getCached<DayPriceTrend[]>(cacheKey)
        if (cached && cached.length > 0) {
            return NextResponse.json({
                success: true,
                data: cached,
                meta: { cached: true }
            })
        }

        // 2. Supabase에서 조회
        const dbTrends = await getPriceTrends(route, 150)

        // 3. DB에 데이터가 있으면 반환
        if (dbTrends.length > 0) {
            const formattedTrends: DayPriceTrend[] = dbTrends.map(trend => ({
                date: trend.date,
                price: trend.price,
                isWeekend: trend.is_weekend || false,
            }))

            // 캐시 저장 (1시간)
            await setCache(cacheKey, formattedTrends, 3600)

            return NextResponse.json({
                success: true,
                data: formattedTrends,
                meta: { cached: false, source: 'database' }
            })
        }

        // 4. DB에 데이터가 없으면 Mock 데이터 생성
        const mockTrends: DayPriceTrend[] = []
        const startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 2)

        for (let i = 0; i < 150; i++) {
            const date = new Date(startDate)
            date.setDate(startDate.getDate() + i)

            const dateStr = date.toISOString().split('T')[0]
            const day = date.getDay()
            const isWeekend = day === 0 || day === 6

            const basePrice = 180000
            const fluctuation = Math.sin(i / 10) * 50000 + (Math.random() * 30000)
            const price = basePrice + fluctuation + (isWeekend ? 40000 : 0)

            mockTrends.push({
                date: dateStr,
                price: Math.floor(price / 100) * 100,
                isWeekend
            })
        }

        // Mock 데이터 캐시 (1시간)
        await setCache(cacheKey, mockTrends, 3600)

        return NextResponse.json({
            success: true,
            data: mockTrends,
            meta: { cached: false, source: 'mock' }
        })
    } catch (error) {
        console.error('Price trends error:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch price trends',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
