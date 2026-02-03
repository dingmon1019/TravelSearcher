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
import { cn } from "@/lib/utils"

function SearchResults() {
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(true)
    const [results, setResults] = useState<FlightOffer[]>([])
    const [sort, setSort] = useState("price")
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 20

    const from = searchParams.get("from") || ""
    const to = searchParams.get("to") || ""
    const adults = parseInt(searchParams.get("adults") || "1")
    const children = parseInt(searchParams.get("children") || "0")
    const infants = parseInt(searchParams.get("infants") || "0")
    const seatClass = searchParams.get("seatClass") || "economy"
    const depDate = searchParams.get("dep") || ""
    const retDate = searchParams.get("ret") || ""

    const seatClassMap: Record<string, string> = {
        economy: "일반석",
        premium: "프리미엄 일반석",
        business: "비즈니스",
        first: "일등석"
    }

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
            setCurrentPage(1) // 검색 파라미터나 정렬 변경 시 1페이지로 리셋
        }
    }, [searchParams, sort])

    const totalPages = Math.ceil(results.length / pageSize)
    const paginatedResults = results.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    return (
        <div className="space-y-8">
            {/* Re-search Form Section - Desktop only in expanded way, simplified for mobile */}
            <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6 md:py-10 bg-gradient-to-b from-blue-50/50 to-white border-b border-slate-100 mb-2 md:mb-4">
                <div className="max-w-7xl mx-auto">
                    {isDesktop ? (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-x-12 gap-y-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">인원 및 좌석</span>
                                    <span className="text-lg font-black text-slate-900">
                                        성인 {adults}{children > 0 && `, 소아 ${children}`}{infants > 0 && `, 유아 ${infants}`} · {seatClassMap[seatClass] || seatClass}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">일정</span>
                                    <span className="text-lg font-black text-slate-900">
                                        {depDate}{retDate && ` ~ ${retDate}`}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">여정</span>
                                    <span className="text-lg font-black text-slate-900">{from} → {to}</span>
                                </div>
                                <div className="ml-auto flex items-center gap-3">
                                    <Drawer>
                                        <DrawerTrigger asChild>
                                            <Button variant="outline" className="rounded-2xl font-bold px-6 h-12 border-slate-200 hover:bg-slate-50">검색 수정</Button>
                                        </DrawerTrigger>
                                        <DrawerContent className="h-[90vh]">
                                            <div className="max-w-4xl mx-auto w-full overflow-y-auto p-10">
                                                <DrawerHeader>
                                                    <DrawerTitle className="text-2xl font-black mb-6">검색 필터 수정</DrawerTitle>
                                                </DrawerHeader>
                                                <SearchForm />
                                            </div>
                                        </DrawerContent>
                                    </Drawer>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-lg font-black text-slate-900">{from} → {to}</span>
                                    <Drawer>
                                        <DrawerTrigger asChild>
                                            <Button variant="ghost" size="sm" className="rounded-xl font-bold text-blue-600">수정</Button>
                                        </DrawerTrigger>
                                        <DrawerContent className="h-[90vh]">
                                            <div className="overflow-y-auto p-4">
                                                <SearchForm />
                                            </div>
                                        </DrawerContent>
                                    </Drawer>
                                </div>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-slate-500">
                                    <span>{depDate}{retDate && ` ~ ${retDate}`}</span>
                                    <span className="w-[1px] h-3 bg-slate-200 self-center"></span>
                                    <span>인원 {adults + children + infants}명</span>
                                    <span className="w-[1px] h-3 bg-slate-200 self-center"></span>
                                    <span>{seatClassMap[seatClass] || seatClass}</span>
                                </div>
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
                            {loading ? "항공권을 찾는 중..." : results.length > 0 ? `총 ${results.length}개의 결과` : "검색 결과가 없습니다"}
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
                    ) : results.length > 0 ? (
                        <div className="space-y-6">
                            <div className="space-y-3 md:space-y-4">
                                {paginatedResults.map((flight, idx) => (
                                    <FlightCard
                                        key={flight.id}
                                        {...flight}
                                        price={flight.price.toLocaleString()}
                                        index={(currentPage - 1) * pageSize + idx}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Card className="border-dashed border-2 border-slate-200 shadow-none bg-slate-50/50">
                            <CardContent className="py-20 flex flex-col items-center justify-center text-center">
                                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                    <Filter className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">검색 결과가 없습니다</h3>
                                <p className="text-slate-500 font-medium max-w-sm">
                                    실시간 항공권 조회에 실패했거나 해당 조건의 항공권이 현재 존재하지 않습니다. 검색 조건을 변경하여 다시 시도해 보세요.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-6">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="rounded-xl font-bold"
                            >
                                이전
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    // TODO: 5페이지 이상일 때 슬라이딩 윈도우 구현 가능
                                    const pageNum = i + 1;
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={currentPage === pageNum ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={cn(
                                                "w-10 h-10 rounded-xl font-bold",
                                                currentPage === pageNum ? "bg-blue-600 hover:bg-blue-700" : ""
                                            )}
                                        >
                                            {pageNum}
                                        </Button>
                                    )
                                })}
                                {totalPages > 5 && <span className="text-slate-400 mx-1">...</span>}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="rounded-xl font-bold"
                            >
                                다음
                            </Button>
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
