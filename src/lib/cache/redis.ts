import { Redis } from '@upstash/redis'

// Upstash Redis 클라이언트 초기화
let redisInstance: Redis | null = null;

/**
 * Redis 클라이언트를 지연 초기화(Lazy Initialization)하여 빌드 시 환경 변수 누락으로 인한 에러를 방지합니다.
 */
export function getRedis() {
    if (redisInstance) return redisInstance;

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        if (process.env.NODE_ENV === 'production') {
            console.error('[Redis] Missing environment variables');
        } else {
            console.warn('[Redis] Missing environment variables, caching disabled');
        }
        return null;
    }

    redisInstance = new Redis({ url, token });
    return redisInstance;
}

/**
 * 캐시에서 데이터 조회
 */
export async function getCached<T>(key: string): Promise<T | null> {
    const client = getRedis();
    if (!client) return null;

    try {
        const data = await client.get<string>(key)
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
    const client = getRedis();
    if (!client) return;

    try {
        await client.setex(key, ttlSeconds, JSON.stringify(value))
    } catch (error) {
        console.error('Redis set error:', error)
    }
}

/**
 * 캐시 키 삭제
 */
export async function deleteCache(key: string): Promise<void> {
    const client = getRedis();
    if (!client) return;

    try {
        await client.del(key)
    } catch (error) {
        console.error('Redis delete error:', error)
    }
}

/**
 * 캐시 키 존재 여부 확인
 */
export async function hasCache(key: string): Promise<boolean> {
    const client = getRedis();
    if (!client) return false;

    try {
        const exists = await client.exists(key)
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
