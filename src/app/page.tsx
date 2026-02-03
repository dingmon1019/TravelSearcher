import { SearchForm } from "@/components/search-form"

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center pt-20 px-4">
      <div className="w-full max-w-5xl space-y-8">
        <div className="space-y-2 text-left">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Flight Crawler
          </h1>
          <p className="text-muted-foreground">
            임직원 전용 항공권 검색 서비스
          </p>
        </div>

        <SearchForm />
      </div>
    </main>
  )
}
