import { SearchForm } from "@/components/search-form"
import { SiteHeader } from "@/components/site-header"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-900">
      <SiteHeader />

      <main className="flex-1 flex flex-col items-center pt-20 px-4">
        <div className="w-full max-w-5xl space-y-8">
          <div className="space-y-2 text-left">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Flight Crawler
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              한국리서치 임직원 전용 (dingmon제작)
            </p>
          </div>

          <SearchForm />
        </div>
      </main>
    </div>
  )
}
