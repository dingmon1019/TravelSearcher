# TravelSearcher

무료 항공권 검색 서비스 - Vercel + Supabase + Upstash

## 🚀 Features

- ✈️ 항공권 검색 (편도/왕복)
- 📊 150일 가격 추이 그래프
- 💰 최저가 하이라이트
- ⚡ Redis 캐싱으로 빠른 응답
- 🌍 글로벌 CDN 배포

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React, TailwindCSS
- **Backend**: Next.js API Routes (Serverless)
- **Database**: Supabase (PostgreSQL)
- **Cache**: Upstash Redis
- **Deployment**: Vercel

## 💰 Cost

**$0/month** - 완전 무료!

- Vercel: Free tier
- Supabase: 500MB free
- Upstash: 10K requests/day free

## 🏃 Quick Start

### 1. Clone repository

```bash
git clone https://github.com/dingmon1019/TravelSearcher.git
cd TravelSearcher/web
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Upstash Redis
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### 4. Set up Supabase database

Run the SQL in `supabase_schema.sql` in your Supabase SQL Editor.

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dingmon1019/TravelSearcher)

1. Click the button above
2. Add environment variables
3. Deploy!

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js App   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│Redis │  │Supa- │
│Cache │  │base  │
└──────┘  └──────┘
```

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome!

## 📧 Contact

For questions, open an issue.
