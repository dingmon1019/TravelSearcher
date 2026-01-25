import { Redis } from '@upstash/redis'

// Upstash Redis 클라이언트 초기화
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

/**
 * 캐시에서 데이터 조회
 */
export async function getCached<T>(key: string): Promise<T | null> {
    try {
        const data = await redis.get<string>(key)
        if (!data) return null
        return JSON.parse(data) as T
    } catch (error) {
        console.error('Redis get error:', error)
        return null
    }
}

/**
 * 캐시에 데이터 저장
 */
export async function setCache(
    key: string,
    value: any,
    ttlSeconds: number = 300 // 기본 5분
): Promise<void> {
    try {
        await redis.setex(key, ttlSeconds, JSON.stringify(value))
    } catch (error) {
        console.error('Redis set error:', error)
    }
}

/**
 * 캐시 키 삭제
 */
export async function deleteCache(key: string): Promise<void> {
    try {
        await redis.del(key)
    } catch (error) {
        console.error('Redis delete error:', error)
    }
}

/**
 * 캐시 키 존재 여부 확인
 */
export async function hasCache(key: string): Promise<boolean> {
    try {
        const exists = await redis.exists(key)
        return exists === 1
    } catch (error) {
        console.error('Redis exists error:', error)
        return false
    }
}

/**
 * 캐시 키 생성 헬퍼
 */
export function createCacheKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}:${params[key]}`)
        .join('|')
    return `${prefix}:${sortedParams}`
}
