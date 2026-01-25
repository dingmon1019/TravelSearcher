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

function SearchResults() {
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(true)
    const [results, setResults] = useState<FlightOffer[]>([])
    const [sort, setSort] = useState("price")

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
            {/* Re-search Form Section */}
            <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-10 bg-gradient-to-b from-blue-50/50 to-white border-b border-slate-100 mb-4">
                <div className="max-w-7xl mx-auto">
                    <SearchForm />
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Filters */}
                <aside className="w-full md:w-64 space-y-6">
                    <Card className="border-slate-100 shadow-sm rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-slate-800">필터</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
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
                        </CardContent>
                    </Card>
                </aside>

                {/* Results List */}
                <div className="flex-1 space-y-6">
                    <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                            {loading ? "항공권을 찾는 중..." : `총 ${results.length}개의 추천 항공권`}
                        </h2>
                        <SortHeader currentSort={sort} onSortChange={setSort} />
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
                        <div className="space-y-4">
                            {results.map((flight) => (
                                <FlightCard
                                    key={flight.id}
                                    airline={flight.airline}
                                    flightNumber={flight.flightNumber}
                                    departureTime={flight.departureTime}
                                    arrivalTime={flight.arrivalTime}
                                    originCode={flight.originCode}
                                    destinationCode={flight.destinationCode}
                                    duration={flight.duration}
                                    price={flight.price.toLocaleString()}
                                    stopCount={flight.stopCount}
                                    departureDate={flight.departureDate}
                                    returnInfo={flight.returnInfo}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
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
