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

        // 2. 기점 데이터 생성 (오늘 기준 전후 150일 확보)
        const trends: DayPriceTrend[] = []
        const startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 2)

        // DB 데이터 조회
        const dbTrends: any[] = await getPriceTrends(route, 300) // 넉넉하게 조회
        const dbMap = new Map<string, number>(dbTrends.map(t => [t.date as string, t.price as number]))

        for (let i = 0; i < 150; i++) {
            const date = new Date(startDate)
            date.setDate(startDate.getDate() + i)

            const dateStr = date.toISOString().split('T')[0]
            const day = date.getDay()
            const isWeekend = day === 0 || day === 6

            // DB에 실제 데이터가 있으면 그것을 사용, 없으면 Mock 생성
            let price: number
            if (dbMap.has(dateStr)) {
                price = dbMap.get(dateStr)!
            } else {
                const basePrice = 180000
                const fluctuation = Math.sin(i / 10) * 50000 + (Math.random() * 30000)
                price = Math.floor((basePrice + fluctuation + (isWeekend ? 40000 : 0)) / 100) * 100
            }

            trends.push({
                date: dateStr,
                price,
                isWeekend
            })
        }

        // 캐시 저장 (1시간)
        await setCache(cacheKey, trends, 3600)

        return NextResponse.json({
            success: true,
            data: trends,
            meta: {
                cached: false,
                realDataCount: dbMap.size,
                totalCount: trends.length
            }
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
