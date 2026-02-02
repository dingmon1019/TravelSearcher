"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { FlightCard } from "@/components/flight-card"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Skeleton } from "@/components/ui/skeleton"
import { PriceGraph } from "@/components/price-graph"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import type { FlightOffer } from "@/lib/types/flight"
import { SortHeader } from "@/components/sort-header"
import { SearchForm } from "@/components/search-form"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Filter } from "lucide-react"

function SearchResults() {
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(true)
    const [results, setResults] = useState<FlightOffer[]>([])
    const [sort, setSort] = useState("price")

    const from = searchParams.get("from") || ""
    const to = searchParams.get("to") || ""

    useEffect(() => {
        const fetchFlights = async () => {
            setLoading(true)
            try {
                const query = new URLSearchParams(searchParams)
                query.set("sort", sort)
                const res = await fetch(`/api/flights/search?${query.toString()}`)
                const data = await res.json()
                setResults(data.data || [])
            } catch (error) {
                console.error("Failed to fetch flights", error)
            } finally {
                setLoading(false)
            }
        }

        if (searchParams) {
            fetchFlights()
        }
    }, [searchParams, sort])

    return (
        <div className="space-y-8">
            {/* Re-search Form Section - Desktop only in expanded way, simplified for mobile */}
            <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6 md:py-10 bg-gradient-to-b from-blue-50/50 to-white border-b border-slate-100 mb-2 md:mb-4">
                <div className="max-w-7xl mx-auto">
                    {isDesktop ? (
                        <SearchForm />
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-400 uppercase">여정</span>
                                    <span className="text-lg font-black text-slate-900">{from} → {to}</span>
                                </div>
                                <Drawer>
                                    <DrawerTrigger asChild>
                                        <Button variant="outline" size="sm" className="rounded-xl font-bold">변경</Button>
                                    </DrawerTrigger>
                                    <DrawerContent className="h-[90vh]">
                                        <div className="overflow-y-auto p-4">
                                            <SearchForm />
                                        </div>
                                    </DrawerContent>
                                </Drawer>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Filters - Desktop only or Drawer for mobile */}
                {isDesktop ? (
                    <aside className="w-full md:w-64 space-y-6">
                        <Card className="border-slate-100 shadow-sm rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-slate-800">필터</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FilterContents />
                            </CardContent>
                        </Card>
                    </aside>
                ) : null}

                {/* Results List */}
                <div className="flex-1 space-y-4 md:space-y-6">
                    {!isDesktop && (
                        <div className="flex items-center gap-2 mb-2 overflow-x-auto no-scrollbar pb-1">
                            <Drawer>
                                <DrawerTrigger asChild>
                                    <Button variant="outline" size="sm" className="rounded-full font-bold flex items-center gap-2 border-slate-200">
                                        <Filter className="w-3.5 h-3.5" />
                                        필터
                                    </Button>
                                </DrawerTrigger>
                                <DrawerContent className="p-6">
                                    <DrawerHeader className="px-0">
                                        <DrawerTitle>필터 설정</DrawerTitle>
                                    </DrawerHeader>
                                    <div className="py-6 space-y-8">
                                        <FilterContents />
                                    </div>
                                    <div className="mt-4">
                                        <Button className="w-full h-14 rounded-2xl bg-blue-600 font-bold text-lg" onClick={() => { }}>적용하기</Button>
                                    </div>
                                </DrawerContent>
                            </Drawer>
                            <SortHeader currentSort={sort} onSortChange={setSort} />
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4">
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                            {loading ? "항공권을 찾는 중..." : `총 ${results.length}개의 결과`}
                        </h2>
                        {isDesktop && <SortHeader currentSort={sort} onSortChange={setSort} />}
                    </div>

                    {/* Price Graph */}
                    <PriceGraph />

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="h-40 border-slate-50 shadow-sm animate-pulse">
                                    <CardContent className="p-6 flex items-center gap-6">
                                        <Skeleton className="h-16 w-16 rounded-2xl" />
                                        <div className="space-y-3 flex-1">
                                            <Skeleton className="h-6 w-[60%]" />
                                            <Skeleton className="h-4 w-[40%]" />
                                        </div>
                                        <Skeleton className="h-10 w-24 rounded-xl" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3 md:space-y-4">
                            {results.map((flight) => (
                                <FlightCard
                                    key={flight.id}
                                    {...flight}
                                    price={flight.price.toLocaleString()}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function FilterContents() {
    return (
        <>
            <div className="space-y-4">
                <h4 className="font-bold text-sm text-slate-600 uppercase tracking-wider">경유</h4>
                <div className="flex items-center space-x-2">
                    <Checkbox id="direct" defaultChecked />
                    <Label htmlFor="direct" className="font-medium cursor-pointer">직항</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="one-stop" />
                    <Label htmlFor="one-stop" className="font-medium cursor-pointer">1회 경유</Label>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="font-bold text-sm text-slate-600 uppercase tracking-wider">가격 범위</h4>
                <div className="pt-2">
                    <Slider defaultValue={[100]} max={100} step={1} />
                    <div className="flex justify-between mt-2 text-xs text-slate-400 font-bold">
                        <span>0원</span>
                        <span>무제한</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="font-bold text-sm text-slate-600 uppercase tracking-wider">출발 시간</h4>
                <div className="flex items-center space-x-2">
                    <Checkbox id="morning" />
                    <Label htmlFor="morning" className="font-medium cursor-pointer">오전 (06:00~12:00)</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="afternoon" />
                    <Label htmlFor="afternoon" className="font-medium cursor-pointer">오후 (12:00~18:00)</Label>
                </div>
            </div>
        </>
    )
}

export default function SearchPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <SiteHeader />
            <main className="container mx-auto px-4 py-8">
                <Suspense fallback={<div>Loading search...</div>}>
                    <SearchResults />
                </Suspense>
            </main>
        </div>
    )
}
