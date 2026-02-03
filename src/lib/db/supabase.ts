import { createClient } from '@supabase/supabase-js'

let supabaseInstance: any = null;

/**
 * Supabase 클라이언트를 지연 초기화(Lazy Initialization)하여 빌드 시 환경 변수 누락으로 인한 에러를 방지합니다.
 */
export function getSupabase() {
    if (supabaseInstance) return supabaseInstance;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        if (process.env.NODE_ENV === 'production') {
            console.error('[Supabase] Missing environment variables');
        } else {
            console.warn('[Supabase] Missing environment variables, using mock behavior');
        }
        return null;
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey);
    return supabaseInstance;
}

/**
 * 가격 추이 데이터 조회
 */
export async function getPriceTrends(route: string, days: number = 150) {
    const client = getSupabase();
    if (!client) return [];

    const { data, error } = await client
        .from('price_trends')
        .select('*')
        .eq('route', route)
        .order('date', { ascending: true })
        .limit(days)

    if (error) {
        console.error('Supabase query error:', error)
        return []
    }

    return data || []
}

/**
 * 가격 추이 데이터 저장
 */
export async function savePriceTrend(trend: {
    route: string
    date: string
    price: number
    provider?: string
    is_weekend?: boolean
}) {
    const client = getSupabase();
    if (!client) return false;

    const { error } = await client
        .from('price_trends')
        .insert(trend)

    if (error) {
        console.error('Supabase insert error:', error)
        return false
    }

    return true
}

/**
 * 검색 캐시 저장 (DB 레벨)
 */
export async function saveSearchCache(cacheKey: string, results: any, expiresAt: Date) {
    const client = getSupabase();
    if (!client) return false;

    const { error } = await client
        .from('search_cache')
        .upsert({
            cache_key: cacheKey,
            results,
            expires_at: expiresAt.toISOString()
        })

    if (error) {
        console.error('Supabase cache save error:', error)
        return false
    }

    return true
}

/**
 * 검색 캐시 조회 (DB 레벨)
 */
export async function getSearchCache(cacheKey: string) {
    const client = getSupabase();
    if (!client) return null;

    const { data, error } = await client
        .from('search_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single()

    if (error || !data) {
        return null
    }

    return data.results
}
