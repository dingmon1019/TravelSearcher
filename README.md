# TravelSearcher

무료 항공권 검색 서비스 - Kiwi + Amadeus + Supabase + Upstash

## 🚀 Features

- ✈️ **실시간 항공권 검색**: Amadeus 및 Kiwi (Tequila) API를 활용한 전 세계 항공권 실시간 조회.
- 🔗 **실제 예약 페이지 연결**: 검색된 항공권을 클릭하면 해당 항공사나 여행사의 결제 페이지(Deep Link)로 즉시 리다이렉팅.
- 📊 **최저가 추이 그래프**: 150일간의 가격 변동 데이터를 시각화하며, 현재 검색 결과의 최저가를 실시간으로 그래프에 동기화.
- 🔍 **고도화된 필터링**: 가격 범위, 경유 횟수, 항공사별 필터 및 URL 파라미터 기반의 상태 유지 기능.
- ⚡ **이중 캐싱 시스템**: Redis(Upstash)와 Supabase를 활용한 초고속 응답 및 API 호출 비용 최적화.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes (Serverless)
- **Database**: Supabase (PostgreSQL) - 가격 추이 및 장기 캐시 저장
- **Cache**: Upstash Redis - 실시간 검색 결과 캐싱
- **APIs**: Kiwi Tequila API, Amadeus Flight Search API

## 💰 Cost Efficiency

**$0/month Goal** - 'Zero Maintenance Cost' 지향

- Vercel: Free tier
- Supabase: 500MB free (가격 추이 데이터 관리)
- Upstash: 10K requests/day free (검색 속도 최적화)
- Kiwi/Amadeus: 개발자용 무료 테스트 티어 활용

## 🏃 Quick Start

### 1. 저장소 복제

```bash
git clone https://github.com/dingmon1019/TravelSearcher.git
cd TravelSearcher
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정 (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# APIs
AMADEUS_CLIENT_ID=your_amadeus_id
AMADEUS_CLIENT_SECRET=your_amadeus_secret
KIWI_API_KEY=your_kiwi_api_key

# Upstash Redis
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### 4. 로컬 실행

```bash
npm run dev
```

## 📦 Deployment (Vercel)

1. GitHub 저장소 연결
2. 위 환경 변수(Environment Variables) 등록
3. 빌드 및 배포 완료!

---
**작성일**: 2026-02-04
**작성자**: 시리 (OpenClaw Assistant)
