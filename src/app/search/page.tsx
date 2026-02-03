"use client"

import { useEffect, useState, Suspense, useMemo } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { FlightCard } from "@/components/flight-card"
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
import { Filter, Bell, Mail, TrendingDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

function PriceAlertModal({ from, to }: { from: string, to: string }) {
    const [email, setEmail] = useState("")
    const [threshold, setThreshold] = useState("1000000")
    const [isOpen, setIsOpen] = useState(false)
    const [isSubscribed, setIsSubscribed] = useState(false)

    const handleSubscribe = () => {
        if (!email) {
            alert("이메일을 입력해주세요.")
            return
        }
        setIsSubscribed(true)
        setTimeout(() => {
            setIsOpen(false)
            setIsSubscribed(false)
        }, 2000)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-2xl font-bold flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5">
                    <Bell className="w-4 h-4" />
                    가격 알림 받기
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-3xl p-8">
                <DialogHeader>
                    <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                        <Bell className="w-6 h-6 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-black">{from} → {to}</DialogTitle>
                    <DialogDescription className="text-base font-medium">
                        가격이 떨어지면 즉시 이메일로 알려드립니다.
                    </DialogDescription>
                </DialogHeader>
                
                {isSubscribed ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold">알림 설정 완료!</h3>
                        <p className="text-muted-foreground font-medium">최저가 업데이트 소식을 보내드릴게요.</p>
                    </div>
                ) : (
                    <div className="space-y-6 py-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-bold ml-1">알림 받을 이메일</Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input 
                                    id="email" 
                                    placeholder="example@email.com" 
                                    className="pl-11 h-14 rounded-2xl border-border bg-muted/30 focus:bg-card"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="threshold" className="text-sm font-bold ml-1">알림 기준 가격 (원 이하)</Label>
                            <div className="relative">
                                <TrendingDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input 
                                    id="threshold" 
                                    type="number"
                                    placeholder="1,000,000" 
                                    className="pl-11 h-14 rounded-2xl border-border bg-muted/30 focus:bg-card"
                                    value={threshold}
                                    onChange={(e) => setThreshold(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button className="w-full h-14 rounded-2xl bg-primary font-bold text-lg shadow-lg shadow-primary/20" onClick={handleSubscribe}>
                            알림 활성화하기
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

function SearchResults() {
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    
    const [loading, setLoading] = useState(true)
    const [results, setResults] = useState<FlightOffer[]>([])
    const [facets, setFacets] = useState<any>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 20

    // URL 파라미터에서 초기 상태 로드
    const [maxPrice, setMaxPrice] = useState<number>(() => {
        const val = searchParams.get("maxPrice")
        return val ? parseInt(val) : 3000000
    })
    const [selectedStops, setSelectedStops] = useState<number[]>(() => {
        const val = searchParams.get("stops")
        return val ? val.split(',').map(s => parseInt(s)) : [0, 1, 2]
    })
    const [selectedAirlines, setSelectedAirlines] = useState<string[]>(() => {
        const val = searchParams.get("airlines")
        return val ? val.split(',') : []
    })
    const [sort, setSort] = useState(searchParams.get("sort") || "price")

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

    // 1. URL 파라미터가 변경될 때마다 데이터 패치
    useEffect(() => {
        const fetchFlights = async () => {
            setLoading(true)
            try {
                // searchParams에 이미 모든 필터가 포함되어 있음
                const res = await fetch(`/api/flights/search?${searchParams.toString()}`)
                const data = await res.json()
                setResults(data.data || [])
                setFacets(data.facets || null)
            } catch (error) {
                console.error("Failed to fetch flights", error)
            } finally {
                setLoading(false)
            }
        }

        if (searchParams.get("from") && searchParams.get("to")) {
            fetchFlights()
            setCurrentPage(1)
        }
    }, [searchParams])

    // 2. 로컬 필터 상태가 변경되면 URL 업데이트 (디바운스 적용)
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString())
            
            // 가격 필터 동기화
            if (maxPrice < 3000000) params.set("maxPrice", maxPrice.toString())
            else params.delete("maxPrice")
            
            // 경유 필터 동기화
            if (selectedStops.length < 3) params.set("stops", selectedStops.sort().join(','))
            else params.delete("stops")
            
            // 항공사 필터 동기화
            if (selectedAirlines.length > 0) params.set("airlines", selectedAirlines.sort().join(','))
            else params.delete("airlines")
            
            // 정렬 동기화
            params.set("sort", sort)
            
            const nextParams = params.toString()
            if (searchParams.toString() !== nextParams) {
                router.replace(`${pathname}?${nextParams}`, { scroll: false })
            }
        }, 400)
        
        return () => clearTimeout(timer)
    }, [maxPrice, selectedStops, selectedAirlines, sort, pathname, router, searchParams])

    // 백엔드에서 이미 필터링되어 오지만, 즉각적인 UI 피드백을 위해 클라이언트 사이드 필터링 유지 가능
    // 단, 여기서는 백엔드 연동이 핵심이므로 results를 그대로 사용함
    const paginatedResults = results.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    const totalPages = Math.ceil(results.length / pageSize)

    // 파셋에서 항공사 목록 추출 (없으면 현재 결과에서 추출)
    const availableAirlines = useMemo(() => {
        if (facets?.airlines) return facets.airlines as string[]
        return Array.from(new Set(results.map(f => f.airline))).sort()
    }, [facets, results])

    return (
        <div className="space-y-8">
            {/* Re-search Form Section - Desktop only in expanded way, simplified for mobile */}
            <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6 md:py-10 bg-gradient-to-b from-primary/5 to-background border-b border-border mb-2 md:mb-4">
                <div className="max-w-7xl mx-auto">
                    {isDesktop ? (
                        <div className="space-y-6">
                            <div className="bg-card p-6 rounded-3xl shadow-sm border border-border flex flex-wrap items-center gap-x-12 gap-y-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">인원 및 좌석</span>
                                    <span className="text-lg font-black text-foreground">
                                        성인 {adults}{children > 0 && `, 소아 ${children}`}{infants > 0 && `, 유아 ${infants}`} · {seatClassMap[seatClass] || seatClass}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">일정</span>
                                    <span className="text-lg font-black text-foreground">
                                        {depDate}{retDate && ` ~ ${retDate}`}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">여정</span>
                                    <span className="text-lg font-black text-foreground">{from} → {to}</span>
                                </div>
                                <div className="ml-auto flex items-center gap-3">
                                    <Drawer>
                                        <DrawerTrigger asChild>
                                            <Button variant="outline" className="rounded-2xl font-bold px-6 h-12 border-border hover:bg-accent">검색 수정</Button>
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
                            <div className="bg-card p-4 rounded-2xl shadow-sm border border-border">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-lg font-black text-foreground">{from} → {to}</span>
                                    <Drawer>
                                        <DrawerTrigger asChild>
                                            <Button variant="ghost" size="sm" className="rounded-xl font-bold text-primary">수정</Button>
                                        </DrawerTrigger>
                                        <DrawerContent className="h-[90vh]">
                                            <div className="overflow-y-auto p-4">
                                                <SearchForm />
                                            </div>
                                        </DrawerContent>
                                    </Drawer>
                                </div>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-muted-foreground">
                                    <span>{depDate}{retDate && ` ~ ${retDate}`}</span>
                                    <span className="w-[1px] h-3 bg-border self-center"></span>
                                    <span>인원 {adults + children + infants}명</span>
                                    <span className="w-[1px] h-3 bg-border self-center"></span>
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
                        <Card className="border-border shadow-sm rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-foreground">필터</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FilterContents 
                                    maxPrice={maxPrice} 
                                    setMaxPrice={setMaxPrice}
                                    selectedStops={selectedStops}
                                    setSelectedStops={setSelectedStops}
                                    airlines={availableAirlines}
                                    selectedAirlines={selectedAirlines}
                                    setSelectedAirlines={setSelectedAirlines}
                                />
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
                                    <Button variant="outline" size="sm" className="rounded-full font-bold flex items-center gap-2 border-border">
                                        <Filter className="w-3.5 h-3.5" />
                                        필터
                                    </Button>
                                </DrawerTrigger>
                                <DrawerContent className="p-6">
                                    <DrawerHeader className="px-0">
                                        <DrawerTitle>필터 설정</DrawerTitle>
                                    </DrawerHeader>
                                    <div className="py-6 space-y-8">
                                        <FilterContents 
                                            maxPrice={maxPrice} 
                                            setMaxPrice={setMaxPrice}
                                            selectedStops={selectedStops}
                                            setSelectedStops={setSelectedStops}
                                            airlines={availableAirlines}
                                            selectedAirlines={selectedAirlines}
                                            setSelectedAirlines={setSelectedAirlines}
                                        />
                                    </div>
                                    <div className="mt-4">
                                        <Button className="w-full h-14 rounded-2xl bg-primary font-bold text-lg" onClick={() => { }}>적용하기</Button>
                                    </div>
                                </DrawerContent>
                            </Drawer>
                            <SortHeader currentSort={sort} onSortChange={setSort} />
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4">
                        <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
                            {loading ? "항공권을 찾는 중..." : results.length > 0 ? `총 ${results.length}개의 결과` : "검색 결과가 없습니다"}
                        </h2>
                        {isDesktop && <SortHeader currentSort={sort} onSortChange={setSort} />}
                    </div>

                    {/* Price Graph */}
                    <PriceGraph 
                        currentPrice={results.length > 0 ? results[0].price : undefined} 
                        currentDate={depDate} 
                    />

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="h-40 border-border shadow-sm animate-pulse">
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
                        <Card className="border-dashed border-2 border-border shadow-none bg-muted/50">
                            <CardContent className="py-20 flex flex-col items-center justify-center text-center">
                                <div className="bg-card p-4 rounded-full shadow-sm mb-4">
                                    <Filter className="w-8 h-8 text-muted-foreground/30" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">검색 결과가 없습니다</h3>
                                <p className="text-muted-foreground font-medium max-w-sm">
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
                                                currentPage === pageNum ? "bg-primary hover:bg-primary/90" : ""
                                            )}
                                        >
                                            {pageNum}
                                        </Button>
                                    )
                                })}
                                {totalPages > 5 && <span className="text-muted-foreground mx-1">...</span>}
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

function FilterContents({ 
    maxPrice, 
    setMaxPrice, 
    selectedStops, 
    setSelectedStops,
    airlines,
    selectedAirlines,
    setSelectedAirlines
}: {
    maxPrice: number;
    setMaxPrice: (val: number) => void;
    selectedStops: number[];
    setSelectedStops: (val: number[]) => void;
    airlines: string[];
    selectedAirlines: string[];
    setSelectedAirlines: (val: string[]) => void;
}) {
    const handleStopChange = (stop: number, checked: boolean) => {
        if (checked) {
            setSelectedStops([...selectedStops, stop])
        } else {
            setSelectedStops(selectedStops.filter(s => s !== stop))
        }
    }

    const handleAirlineChange = (airline: string, checked: boolean) => {
        if (checked) {
            setSelectedAirlines([...selectedAirlines, airline])
        } else {
            setSelectedAirlines(selectedAirlines.filter(a => a !== airline))
        }
    }

    return (
        <>
            <div className="space-y-4">
                <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">경유</h4>
                <div className="flex items-center space-x-2">
                    <Checkbox 
                        id="direct" 
                        checked={selectedStops.includes(0)} 
                        onCheckedChange={(checked) => handleStopChange(0, checked as boolean)}
                    />
                    <Label htmlFor="direct" className="font-medium cursor-pointer text-foreground">직항</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox 
                        id="one-stop" 
                        checked={selectedStops.includes(1)} 
                        onCheckedChange={(checked) => handleStopChange(1, checked as boolean)}
                    />
                    <Label htmlFor="one-stop" className="font-medium cursor-pointer text-foreground">1회 경유</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox 
                        id="multi-stop" 
                        checked={selectedStops.includes(2)} 
                        onCheckedChange={(checked) => handleStopChange(2, checked as boolean)}
                    />
                    <Label htmlFor="multi-stop" className="font-medium cursor-pointer text-foreground">2회 이상 경유</Label>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">가격 범위</h4>
                <div className="pt-2">
                    <Slider 
                        value={[maxPrice]} 
                        max={3000000} 
                        min={0}
                        step={10000} 
                        onValueChange={(vals) => setMaxPrice(vals[0])}
                    />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground font-bold">
                        <span>0원</span>
                        <span>{maxPrice.toLocaleString()}원 이하</span>
                    </div>
                </div>
            </div>

            {airlines.length > 0 && (
                <div className="space-y-4">
                    <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">항공사</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {airlines.map(airline => (
                            <div key={airline} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`airline-${airline}`} 
                                    checked={selectedAirlines.includes(airline)}
                                    onCheckedChange={(checked) => handleAirlineChange(airline, checked as boolean)}
                                />
                                <Label htmlFor={`airline-${airline}`} className="font-medium cursor-pointer truncate text-foreground">{airline}</Label>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    )
}

export default function SearchPage() {
    return (
        <main className="container mx-auto px-4 py-8">
            <Suspense fallback={<div>Loading search...</div>}>
                <SearchResults />
            </Suspense>
        </main>
    )
}
