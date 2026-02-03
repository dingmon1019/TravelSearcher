"use client"

import * as React from "react"
import { CalendarIcon, MapPin, Search, Globe, X, ArrowLeftRight, Minus, Plus, Users, Wallet, Clock } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { DateRange } from "react-day-picker"
import { LocationOption } from "@/lib/types/flight"
import { toast } from "sonner"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"

export function SearchForm() {
    const isDesktop = useMediaQuery("(min-width: 768px)")
    // Trip Type state
    const [tripType, setTripType] = React.useState<"round" | "oneway" | "multicity">("round")

    // Multi-city Segments state
    const [segments, setSegments] = React.useState<{ from: string[], to: string[], date: Date | undefined }[]>([
        { from: [], to: [], date: undefined },
        { from: [], to: [], date: undefined }
    ])

    const addSegment = () => {
        if (segments.length < 5) {
            setSegments([...segments, { from: [], to: [], date: undefined }])
        } else {
            toast.error("최대 5개의 구간까지만 추가할 수 있습니다.")
        }
    }

    const removeSegment = (index: number) => {
        if (segments.length > 2) {
            setSegments(segments.filter((_, i) => i !== index))
        }
    }

    const updateSegment = (index: number, field: "from" | "to" | "date", value: any) => {
        setSegments(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
    }

    // Departure & Destination State
    const [selectedDepartures, setSelectedDepartures] = React.useState<string[]>([])
    const [isDepartureOpen, setIsDepartureOpen] = React.useState(false)
    const [selectedDestinations, setSelectedDestinations] = React.useState<string[]>([])
    const [isDestinationOpen, setIsDestinationOpen] = React.useState(false)

    // Passenger & Class State
    const [passengers, setPassengers] = React.useState({
        adults: 1,
        children: 0,
        infants: 0
    })
    const [seatClass, setSeatClass] = React.useState("economy")
    const [isPassengerOpen, setIsPassengerOpen] = React.useState(false)

    // Price Range State
    const [priceRange, setPriceRange] = React.useState([0, 2000000]) // 0 ~ 200만원
    const [minPriceInput, setMinPriceInput] = React.useState("0")
    const [maxPriceInput, setMaxPriceInput] = React.useState("2000000")
    const [isPriceOpen, setIsPriceOpen] = React.useState(false)

    // Date State
    const [searchType, setSearchType] = React.useState<"specific" | "flexible">("specific")
    const [specificDate, setSpecificDate] = React.useState<DateRange | undefined>()
    const [depRange, setDepRange] = React.useState<DateRange | undefined>()

    // Stay Duration (Days)
    const [stayDuration, setStayDuration] = React.useState(4) // Default 3박 4일 (4일)

    // Sync numeric inputs with slider
    React.useEffect(() => {
        setMinPriceInput(priceRange[0].toString())
        setMaxPriceInput(priceRange[1].toString())
    }, [priceRange])

    const handleMinPriceChange = (val: string) => {
        setMinPriceInput(val)
        const num = parseInt(val) || 0
        setPriceRange([Math.min(num, priceRange[1]), priceRange[1]])
    }

    const handleMaxPriceChange = (val: string) => {
        setMaxPriceInput(val)
        const num = parseInt(val) || 0
        setPriceRange([priceRange[0], Math.max(num, priceRange[0])])
    }

    // Initialize dates on client-side to avoid hydration mismatch
    React.useEffect(() => {
        setSpecificDate({
            from: new Date(),
            to: new Date(new Date().setDate(new Date().getDate() + 3))
        })
    }, [])

    // Unified Data Source
    const [departures, setDepartures] = React.useState<LocationOption[]>([])
    const [destinations, setDestinations] = React.useState<LocationOption[]>([])
    const [searchQuery, setSearchQuery] = React.useState("")
    const [searchResults, setSearchResults] = React.useState<LocationOption[]>([])
    const [isLoading, setIsLoading] = React.useState(false)

    // 초기 데이터 로드 (출발지/도착지 기본 목록)
    React.useEffect(() => {
        const fetchDefaults = async () => {
            try {
                const [depRes, destRes] = await Promise.all([
                    fetch('/api/locations?type=departure'),
                    fetch('/api/locations?type=destination')
                ])
                const depData = await depRes.json()
                const destData = await destRes.json()
                if (depData.success) setDepartures(depData.data)
                if (destData.success) setDestinations(destData.data)
            } catch (err) {
                console.error("Failed to load default locations", err)
            }
        }
        fetchDefaults()
    }, [])

    // 실시간 검색 로직 (Debounce 적용 가능하지만 여기선 단순 구현)
    React.useEffect(() => {
        if (!searchQuery || searchQuery.length < 1) {
            setSearchResults([])
            return
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsLoading(true)
            try {
                const res = await fetch(`/api/locations?q=${encodeURIComponent(searchQuery)}`)
                const data = await res.json()
                if (data.success) setSearchResults(data.data)
            } catch (err) {
                console.error("Search failed", err)
            } finally {
                setIsLoading(false)
            }
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [searchQuery])

    const toggleDeparture = (id: string) => {
        setSelectedDepartures([id])
        setIsDepartureOpen(false)
        setSearchQuery("")
    }

    const toggleDestination = (id: string, label?: string) => {
        setSelectedDestinations(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id)
            if (id === 'anywhere') {
                setIsDestinationOpen(false)
                return ['anywhere']
            }
            return [...prev.filter(x => x !== 'anywhere'), id]
        })

        // 검색 결과에서 선택한 경우 검색어 초기화 및 닫기
        if (searchQuery) {
            setSearchQuery("")
            // 단일 선택 모드 느낌이면 닫아줌
            if (isDesktop) setIsDestinationOpen(false)
        }
    }

    const swapLocations = () => {
        if (selectedDepartures.length === 0 && selectedDestinations.length === 0) return
        const dep = selectedDepartures[0]
        const dests = selectedDestinations.filter(d => d !== 'anywhere')
        if (dests.length > 0) {
            setSelectedDepartures([dests[0]])
            setSelectedDestinations(dep ? [dep] : [])
        }
    }

    const handleSearch = () => {
        // Validation for Multi-city
        if (tripType === "multicity") {
            for (let i = 0; i < segments.length; i++) {
                if (segments[i].from.length === 0) {
                    toast.error(`${i + 1}번째 구간의 출발지를 선택해주세요.`)
                    return
                }
                if (segments[i].to.length === 0) {
                    toast.error(`${i + 1}번째 구간의 도착지를 선택해주세요.`)
                    return
                }
                if (!segments[i].date) {
                    toast.error(`${i + 1}번째 구간의 날짜를 선택해주세요.`)
                    return
                }
            }
        } else {
            // Validation for Round/Oneway
            if (selectedDepartures.length === 0) {
                toast.error("출발지를 선택해주세요.", { description: "출발지는 필수 입력 항목입니다." })
                return
            }
        }

        const params = new URLSearchParams()
        params.set("tripType", tripType)
        params.set("adults", passengers.adults.toString())
        params.set("children", passengers.children.toString())
        params.set("infants", passengers.infants.toString())
        params.set("seatClass", seatClass)
        params.set("minPrice", priceRange[0].toString())
        params.set("maxPrice", priceRange[1].toString())

        if (tripType === "multicity") {
            const segmentStrings = segments.map(s => 
                `${s.from[0]}:${s.to[0]}:${format(s.date!, "yyyy-MM-dd")}`
            ).join(",")
            params.set("segments", segmentStrings)
        } else {
            const destinations = selectedDestinations.length === 0 ? ['anywhere'] : selectedDestinations
            params.set("from", selectedDepartures.join(","))
            params.set("to", destinations.join(","))

            if (searchType === "flexible") {
                params.set("searchType", "flexible")
                if (depRange?.from) params.set("rangeStart", format(depRange.from, "yyyy-MM-dd"))
                if (depRange?.to) params.set("rangeEnd", format(depRange.to, "yyyy-MM-dd"))

                if (tripType === "round") {
                    params.set("stay", stayDuration.toString())
                }
            } else {
                // Specific Search Mode
                params.set("searchType", "specific")
                if (specificDate?.from) {
                    params.set("dep", format(specificDate.from, "yyyy-MM-dd"))
                    if (tripType === "round" && specificDate.to) {
                        params.set("ret", format(specificDate.to, "yyyy-MM-dd"))
                    }
                }
            }
        }

        window.location.href = `/search?${params.toString()}`
    }

    const formatPrice = (value: number) => {
        if (value >= 10000) {
            const won = Math.floor(value / 10000)
            return `${won}만원`
        }
        return `${value.toLocaleString()}원`
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Title Section */}
            <h1 className="text-4xl md:text-5xl font-extrabold text-center text-foreground mb-8 tracking-tight">
                최저가 항공권, <span className="text-primary">가장 스마트하게</span> 찾는 법
            </h1>

            {/* Main Search Card */}
            <div className="bg-card rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl shadow-muted/60 border border-border p-4 md:p-8">

                {/* Upper Controls */}
                <div className="flex flex-wrap items-center justify-start gap-2 md:gap-3 mb-6 md:mb-8">
                    <div className="flex items-center gap-1.5 bg-muted p-1 rounded-2xl">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "rounded-xl px-4 font-bold transition-all",
                                tripType === "round" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setTripType("round")}
                        >
                            왕복
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "rounded-xl px-4 font-bold transition-all",
                                tripType === "oneway" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setTripType("oneway")}
                        >
                            편도
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "rounded-xl px-4 font-bold transition-all",
                                tripType === "multicity" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setTripType("multicity")}
                        >
                            다구간
                        </Button>
                    </div>

                    <div className="flex items-center gap-1.5 bg-muted p-1 rounded-2xl">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "rounded-xl px-4 font-bold transition-all",
                                searchType === "specific" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setSearchType("specific")}
                        >
                            지정 날짜
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "rounded-xl px-4 font-bold transition-all",
                                searchType === "flexible" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setSearchType("flexible")}
                        >
                            날짜 유연하게
                        </Button>
                    </div>

                    {isDesktop ? (
                        <Popover open={isPriceOpen} onOpenChange={setIsPriceOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-10 rounded-2xl border-border bg-card font-bold text-muted-foreground flex items-center gap-2 hover:bg-accent px-4">
                                    <Wallet className="w-4 h-4 text-muted-foreground/60" />
                                    {formatPrice(priceRange[0])} ~ {priceRange[1] >= 2000000 ? "무제한" : formatPrice(priceRange[1])}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[320px] p-6 rounded-3xl shadow-2xl border-border bg-card">
                                <div className="space-y-6">
                                    <p className="text-xs font-bold text-muted-foreground uppercase">가격 범위 설정</p>
                                    <div className="grid grid-cols-2 gap-3 mb-2">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-muted-foreground ml-1">최소 가격(원)</Label>
                                            <Input
                                                type="number"
                                                value={minPriceInput}
                                                onChange={(e) => handleMinPriceChange(e.target.value)}
                                                className="h-10 rounded-xl font-bold bg-muted border-none ring-0 focus:bg-card"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-muted-foreground ml-1">최대 가격(원)</Label>
                                            <Input
                                                type="number"
                                                value={maxPriceInput}
                                                onChange={(e) => handleMaxPriceChange(e.target.value)}
                                                className="h-10 rounded-xl font-bold bg-muted border-none ring-0 focus:bg-card"
                                            />
                                        </div>
                                    </div>
                                    <div className="px-2">
                                        <Slider
                                            defaultValue={[0, 2000000]}
                                            max={2000000}
                                            step={10000}
                                            value={priceRange}
                                            onValueChange={setPriceRange}
                                            className="py-2"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-sm font-black text-foreground border-t border-border pt-4">
                                        <span>{formatPrice(priceRange[0])}</span>
                                        <span>{priceRange[1] >= 2000000 ? "무제한" : formatPrice(priceRange[1])}</span>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    ) : (
                        <Drawer open={isPriceOpen} onOpenChange={setIsPriceOpen}>
                            <DrawerTrigger asChild>
                                <Button variant="outline" className="h-10 rounded-2xl border-border bg-card font-bold text-muted-foreground flex items-center gap-2 hover:bg-accent px-4">
                                    <Wallet className="w-4 h-4 text-muted-foreground/60" />
                                    {formatPrice(priceRange[0])} ~ {priceRange[1] >= 2000000 ? "무제한" : formatPrice(priceRange[1])}
                                </Button>
                            </DrawerTrigger>
                            <DrawerContent className="p-6">
                                <DrawerHeader className="px-0">
                                    <DrawerTitle>가격 범위 설정</DrawerTitle>
                                    <DrawerDescription>예산에 맞는 항공권을 필터링합니다.</DrawerDescription>
                                </DrawerHeader>
                                <div className="space-y-8 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-muted-foreground ml-1 font-bold">최소 가격(원)</Label>
                                            <Input
                                                type="number"
                                                value={minPriceInput}
                                                onChange={(e) => handleMinPriceChange(e.target.value)}
                                                className="h-12 rounded-xl font-bold bg-muted border-none ring-0 focus:bg-card"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-muted-foreground ml-1 font-bold">최대 가격(원)</Label>
                                            <Input
                                                type="number"
                                                value={maxPriceInput}
                                                onChange={(e) => handleMaxPriceChange(e.target.value)}
                                                className="h-12 rounded-xl font-bold bg-muted border-none ring-0 focus:bg-card"
                                            />
                                        </div>
                                    </div>
                                    <div className="px-2">
                                        <Slider
                                            defaultValue={[0, 2000000]}
                                            max={2000000}
                                            step={10000}
                                            value={priceRange}
                                            onValueChange={setPriceRange}
                                            className="py-4"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-lg font-black text-foreground border-t border-border pt-6">
                                        <span>{formatPrice(priceRange[0])}</span>
                                        <span>{priceRange[1] >= 2000000 ? "무제한" : formatPrice(priceRange[1])}</span>
                                    </div>
                                </div>
                                <DrawerFooter className="px-0">
                                    <Button onClick={() => setIsPriceOpen(false)} className="h-14 rounded-2xl bg-primary font-bold text-lg">적용하기</Button>
                                </DrawerFooter>
                            </DrawerContent>
                        </Drawer>
                    )}

                    {isDesktop ? (
                        <Popover open={isPassengerOpen} onOpenChange={setIsPassengerOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-10 rounded-2xl border-border bg-card font-bold text-muted-foreground flex items-center gap-2 hover:bg-accent px-4">
                                    <Users className="w-4 h-4 text-muted-foreground/60" />
                                    {`승객 ${passengers.adults + passengers.children + passengers.infants}명 · ${seatClass === "economy" ? "일반석" : seatClass === "business" ? "비즈니스석" : "일등석"
                                        }`}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[320px] p-6 rounded-3xl shadow-2xl border-border bg-card">
                                <div className="space-y-6">
                                    <p className="text-xs font-bold text-muted-foreground uppercase">승객 선택</p>
                                    {[
                                        { label: '성인', sub: '만 12세 이상', key: 'adults', min: 1 },
                                        { label: '소아', sub: '만 2세 ~ 11세', key: 'children', min: 0 },
                                        { label: '유아', sub: '만 2세 미만', key: 'infants', min: 0 }
                                    ].map((type) => (
                                        <div key={type.key} className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground">{type.label}</span>
                                                <span className="text-[10px] text-muted-foreground">{type.sub}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Button
                                                    variant="outline" size="icon" className="h-8 w-8 rounded-full border-border"
                                                    onClick={() => setPassengers(p => ({ ...p, [type.key]: Math.max(type.min, (p as any)[type.key] - 1) }))}
                                                    disabled={(passengers as any)[type.key] <= type.min}
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </Button>
                                                <span className="font-black text-lg w-4 text-center">{(passengers as any)[type.key]}</span>
                                                <Button
                                                    variant="outline" size="icon" className="h-8 w-8 rounded-full border-border"
                                                    onClick={() => setPassengers(p => ({ ...p, [type.key]: Math.min(6, (p as any)[type.key] + 1) }))}
                                                    disabled={(passengers as any)[type.key] >= 6}
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="pt-4 border-t border-border">
                                        <p className="text-xs font-bold text-muted-foreground uppercase mb-3">좌석 등급</p>
                                        <Select value={seatClass} onValueChange={setSeatClass}>
                                            <SelectTrigger className="w-full h-12 rounded-xl border-border bg-muted/50 font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl shadow-xl">
                                                <SelectItem value="economy">일반석</SelectItem>
                                                <SelectItem value="premium">프리미엄 일반석</SelectItem>
                                                <SelectItem value="business">비즈니스석</SelectItem>
                                                <SelectItem value="first">일등석</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    ) : (
                        <Drawer open={isPassengerOpen} onOpenChange={setIsPassengerOpen}>
                            <DrawerTrigger asChild>
                                <Button variant="outline" className="h-10 rounded-2xl border-border bg-card font-bold text-muted-foreground flex items-center gap-2 hover:bg-accent px-4">
                                    <Users className="w-4 h-4 text-muted-foreground/60" />
                                    {`승객 ${passengers.adults + passengers.children + passengers.infants}명 · ${seatClass === "economy" ? "일반석" : seatClass === "business" ? "비즈니스석" : "일등석"
                                        }`}
                                </Button>
                            </DrawerTrigger>
                            <DrawerContent className="p-6">
                                <DrawerHeader className="px-0">
                                    <DrawerTitle>승객 및 좌석 선택</DrawerTitle>
                                    <DrawerDescription>인원수와 원하는 좌석 등급을 선택하세요.</DrawerDescription>
                                </DrawerHeader>
                                <div className="space-y-8 py-6">
                                    {[
                                        { label: '성인', sub: '만 12세 이상', key: 'adults', min: 1 },
                                        { label: '소아', sub: '만 2세 ~ 11세', key: 'children', min: 0 },
                                        { label: '유아', sub: '만 2세 미만', key: 'infants', min: 0 }
                                    ].map((type) => (
                                        <div key={type.key} className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="font-black text-xl text-foreground">{type.label}</span>
                                                <span className="text-xs text-muted-foreground font-bold">{type.sub}</span>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <Button
                                                    variant="outline" size="icon" className="h-12 w-12 rounded-full border-border bg-muted"
                                                    onClick={() => setPassengers(p => ({ ...p, [type.key]: Math.max(type.min, (p as any)[type.key] - 1) }))}
                                                    disabled={(passengers as any)[type.key] <= type.min}
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </Button>
                                                <span className="font-black text-2xl w-6 text-center">{(passengers as any)[type.key]}</span>
                                                <Button
                                                    variant="outline" size="icon" className="h-12 w-12 rounded-full border-border bg-muted"
                                                    onClick={() => setPassengers(p => ({ ...p, [type.key]: Math.min(6, (p as any)[type.key] + 1) }))}
                                                    disabled={(passengers as any)[type.key] >= 6}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="pt-8 border-t border-border">
                                        <p className="text-xs font-black text-muted-foreground uppercase mb-4">좌석 등급</p>
                                        <Select value={seatClass} onValueChange={setSeatClass}>
                                            <SelectTrigger className="w-full h-14 rounded-2xl border-border bg-muted font-bold text-lg">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl shadow-xl">
                                                <SelectItem value="economy">일반석</SelectItem>
                                                <SelectItem value="premium">프리미엄 일반석</SelectItem>
                                                <SelectItem value="business">비즈니스석</SelectItem>
                                                <SelectItem value="first">일등석</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DrawerFooter className="px-0">
                                    <Button onClick={() => setIsPassengerOpen(false)} className="h-14 rounded-2xl bg-primary font-bold text-lg">완료</Button>
                                </DrawerFooter>
                            </DrawerContent>
                        </Drawer>
                    )}
                </div>

                {/* Main Inputs */}
                {tripType === "multicity" ? (
                    <div className="space-y-4">
                        {segments.map((segment, idx) => (
                            <div key={idx} className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_0.8fr_auto] gap-3 lg:gap-4 items-end bg-muted/20 p-4 md:p-6 rounded-2xl md:rounded-3xl relative border border-border/50">
                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs font-black text-muted-foreground uppercase ml-1">출발지 {idx + 1}</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="bg-card hover:bg-accent border border-border rounded-xl md:rounded-2xl h-14 md:h-16 flex items-center px-4 text-left transition-all">
                                                <MapPin className="w-5 h-5 mr-3 text-muted-foreground" />
                                                <span className={cn("font-bold truncate", segment.from.length > 0 ? "text-foreground" : "text-muted-foreground/40")}>
                                                    {segment.from.length > 0 ? (departures.find(o => o.id === segment.from[0]) || searchResults.find(o => o.id === segment.from[0]))?.label.split(' ')[0] : "출발지"}
                                                </span>
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-0 w-[300px] border-border bg-card">
                                            <Command shouldFilter={false}>
                                                <CommandInput placeholder="검색..." onValueChange={setSearchQuery} />
                                                <CommandList>
                                                    {isLoading && <div className="p-2 text-center text-xs">검색 중...</div>}
                                                    {searchResults.map(o => (
                                                        <CommandItem key={o.id} onSelect={() => updateSegment(idx, "from", [o.id])}>
                                                            <MapPin className="w-4 h-4 mr-2" />
                                                            {o.label}
                                                        </CommandItem>
                                                    ))}
                                                    {!searchQuery && departures.map(o => (
                                                        <CommandItem key={o.id} onSelect={() => updateSegment(idx, "from", [o.id])}>
                                                            <MapPin className="w-4 h-4 mr-2" />
                                                            {o.label}
                                                        </CommandItem>
                                                    ))}
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs font-black text-muted-foreground uppercase ml-1">도착지 {idx + 1}</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="bg-card hover:bg-accent border border-border rounded-xl md:rounded-2xl h-14 md:h-16 flex items-center px-4 text-left transition-all">
                                                <Globe className="w-5 h-5 mr-3 text-muted-foreground" />
                                                <span className={cn("font-bold truncate", segment.to.length > 0 ? "text-foreground" : "text-muted-foreground/40")}>
                                                    {segment.to.length > 0 ? (destinations.find(o => o.id === segment.to[0]) || searchResults.find(o => o.id === segment.to[0]))?.label.split(' ')[0] : "도착지"}
                                                </span>
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-0 w-[300px] border-border bg-card">
                                            <Command shouldFilter={false}>
                                                <CommandInput placeholder="검색..." onValueChange={setSearchQuery} />
                                                <CommandList>
                                                    {isLoading && <div className="p-2 text-center text-xs">검색 중...</div>}
                                                    {searchResults.map(o => (
                                                        <CommandItem key={o.id} onSelect={() => updateSegment(idx, "to", [o.id])}>
                                                            <Globe className="w-4 h-4 mr-2" />
                                                            {o.label}
                                                        </CommandItem>
                                                    ))}
                                                    {!searchQuery && destinations.map(o => (
                                                        <CommandItem key={o.id} onSelect={() => updateSegment(idx, "to", [o.id])}>
                                                            <Globe className="w-4 h-4 mr-2" />
                                                            {o.label}
                                                        </CommandItem>
                                                    ))}
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs font-black text-muted-foreground uppercase ml-1">날짜</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="bg-card hover:bg-accent border border-border rounded-xl md:rounded-2xl h-14 md:h-16 flex items-center px-4 text-left transition-all">
                                                <CalendarIcon className="w-5 h-5 mr-3 text-muted-foreground" />
                                                <span className={cn("font-bold truncate", segment.date ? "text-foreground" : "text-muted-foreground/40")}>
                                                    {segment.date ? format(segment.date, "M월 d일 (eee)", { locale: ko }) : "날짜 선택"}
                                                </span>
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 border-border bg-card">
                                            <Calendar
                                                mode="single"
                                                selected={segment.date}
                                                onSelect={(d) => updateSegment(idx, "date", d)}
                                                locale={ko}
                                                fromDate={idx > 0 && segments[idx - 1].date ? segments[idx - 1].date : new Date()}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="flex items-center h-14 md:h-16">
                                    {segments.length > 2 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                            onClick={() => removeSegment(idx)}
                                        >
                                            <X className="w-5 h-5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto h-12 rounded-2xl border-dashed border-2 font-bold flex items-center gap-2"
                                onClick={addSegment}
                                disabled={segments.length >= 5}
                            >
                                <Plus className="w-4 h-4" />
                                구간 추가
                            </Button>
                            <div className="flex-1" />
                            <Button
                                className="w-full sm:w-[200px] h-14 rounded-2xl bg-primary font-black text-lg shadow-xl shadow-primary/20"
                                onClick={handleSearch}
                            >
                                <Search className="w-5 h-5 mr-2" strokeWidth={3} />
                                다구간 항공권 검색
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_auto_1.1fr_1.3fr_auto] gap-3 lg:gap-6 items-center">

                    {/* 1. Departure */}
                    <div className="flex flex-col gap-2 md:gap-3">
                        <Label className="text-sm md:text-md font-black text-muted-foreground uppercase ml-1 flex items-center gap-2">
                            출발지 <span className="text-[12px] md:text-[15px] text-primary opacity-70">(한 곳)</span>
                        </Label>
                        <Popover open={isDepartureOpen} onOpenChange={setIsDepartureOpen}>
                            <PopoverTrigger asChild>
                                <button className="relative group bg-muted/50 hover:bg-card border-2 border-transparent hover:border-primary/30 rounded-2xl md:rounded-3xl transition-all h-[72px] md:h-[92px] flex items-center px-4 md:px-6 text-left w-full overflow-hidden shadow-sm hover:shadow-md">
                                    <MapPin className="text-muted-foreground group-hover:text-primary w-5 h-5 md:w-6 md:h-6 mr-3 md:mr-4 transition-colors shrink-0" />
                                    <div className="flex-1 overflow-hidden">
                                        {selectedDepartures.length > 0 ? (
                                            <div className="flex items-center">
                                                <span className="text-xl md:text-2xl font-black text-foreground truncate">
                                                    {(departures.find(o => o.id === selectedDepartures[0]) ||
                                                        searchResults.find(o => o.id === selectedDepartures[0]))?.label.split(' ')[0]}
                                                </span>
                                                <div
                                                    role="button"
                                                    className="ml-2 p-1 hover:bg-destructive/10 rounded-full transition-colors flex items-center justify-center cursor-pointer group/close"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedDepartures([]);
                                                    }}
                                                >
                                                    <X className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground/30 group-hover:text-destructive transition-colors" />
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-xl md:text-2xl font-black text-muted-foreground/30">출발도시</span>
                                        )}
                                    </div>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-screen sm:w-[400px] h-[50vh] sm:h-auto shadow-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden border-border bg-card" align="start">
                                <Command className="h-full" shouldFilter={false}>
                                    <CommandInput
                                        placeholder="출발 도시/공항 검색..."
                                        className="h-14 text-base border-none ring-0"
                                        value={searchQuery}
                                        onValueChange={setSearchQuery}
                                    />
                                    <CommandList className="max-h-none sm:max-h-[350px]">
                                        {isLoading && <div className="p-4 text-center text-sm text-muted-foreground">검색 중...</div>}
                                        <CommandEmpty>{searchQuery ? "검색 결과가 없습니다." : "도시를 선택하세요."}</CommandEmpty>

                                        {searchQuery && searchResults.length > 0 && (
                                            <CommandGroup heading="검색 결과">
                                                {searchResults.map(option => (
                                                    <CommandItem key={option.id} onSelect={() => toggleDeparture(option.id)} className="cursor-pointer h-14 text-base">
                                                        <MapPin className={cn("w-4 h-4 mr-2", selectedDepartures.includes(option.id) ? "text-primary" : "text-muted-foreground/30")} />
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-foreground leading-none">{option.label}</span>
                                                            <span className="text-[10px] text-muted-foreground mt-1">{option.sub}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}

                                        {!searchQuery && (
                                            <CommandGroup heading="한국 내 주요 공항 (기본)">
                                                {departures.map(option => (
                                                    <CommandItem key={option.id} onSelect={() => toggleDeparture(option.id)} className="cursor-pointer h-14 text-base">
                                                        <MapPin className={cn("w-4 h-4 mr-2", selectedDepartures.includes(option.id) ? "text-primary" : "text-muted-foreground/30")} />
                                                        <span className="font-black text-foreground mr-2">{option.label}</span>
                                                        <span className="text-xs text-muted-foreground">{option.sub}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex justify-center -my-3 lg:my-0 lg:-mx-3 z-10 pt-4 lg:pt-8 mr-6 lg:mr-0">
                        <Button
                            variant="ghost" size="icon"
                            className="bg-card hover:bg-primary hover:text-primary-foreground border-2 border-border shadow-2xl rounded-full h-10 w-10 md:h-12 md:w-12 transition-all duration-300 active:rotate-180 rotate-90 lg:rotate-0 hover:scale-110"
                            onClick={swapLocations}
                        >
                            <ArrowLeftRight className="w-4 h-4 md:w-5 md:h-5" />
                        </Button>
                    </div>

                    {/* 2. Destination */}
                    <div className="flex flex-col gap-2 md:gap-3">
                        <Label className="text-sm md:text-md font-black text-muted-foreground uppercase ml-1">도착지</Label>
                        <Popover open={isDestinationOpen} onOpenChange={setIsDestinationOpen}>
                            <PopoverTrigger asChild>
                                <button className="relative group bg-muted/50 hover:bg-card border-2 border-transparent hover:border-primary/30 rounded-2xl md:rounded-3xl transition-all h-[72px] md:h-[92px] flex items-center px-4 md:px-6 text-left w-full overflow-hidden shadow-sm hover:shadow-md">
                                    <Globe className="text-muted-foreground group-hover:text-primary w-5 h-5 md:w-6 md:h-6 mr-3 md:mr-4 transition-colors shrink-0" />
                                    <div className="flex-1 overflow-hidden">
                                        {selectedDestinations.length > 0 ? (
                                            <div className="flex gap-2 overflow-x-auto no-scrollbar items-center">
                                                {selectedDestinations.map(id => {
                                                    const item = departures.find(o => o.id === id) ||
                                                        destinations.find(o => o.id === id) ||
                                                        searchResults.find(o => o.id === id) ||
                                                        (id === 'anywhere' ? { label: '어디든지' } : null)
                                                    return (
                                                        <Badge
                                                            key={id}
                                                            variant="secondary"
                                                            className="whitespace-nowrap px-2 md:px-3 py-1 md:py-1.5 text-sm md:text-base font-black bg-primary/10 text-primary hover:bg-primary/20 border-none rounded-lg md:rounded-xl group/badge cursor-default"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {item?.label.split(' ')[0]}
                                                            <div
                                                                role="button"
                                                                className="ml-1.5 md:ml-2 p-0.5 hover:bg-primary/20 rounded-full transition-colors flex items-center justify-center cursor-pointer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleDestination(id);
                                                                }}
                                                            >
                                                                <X className="w-4 h-4 md:w-5 md:h-5 text-primary/30 hover:text-primary" />
                                                            </div>
                                                        </Badge>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <span className="text-xl md:text-2xl font-black text-muted-foreground/30">도착도시</span>
                                        )}
                                    </div>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-screen sm:w-[400px] h-[50vh] sm:h-auto shadow-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden border-border bg-card" align="start">
                                <Command className="h-full" shouldFilter={false}>
                                    <CommandInput
                                        placeholder="어디로 떠나시나요? 도시/국가 검색..."
                                        className="h-14 text-base border-none ring-0"
                                        value={searchQuery}
                                        onValueChange={setSearchQuery}
                                    />
                                    <CommandList className="max-h-none sm:max-h-[350px]">
                                        {isLoading && <div className="p-4 text-center text-sm text-muted-foreground">검색 중...</div>}
                                        <CommandEmpty>{searchQuery ? "검색 결과가 없습니다." : "목적지를 선택하세요."}</CommandEmpty>

                                        {!searchQuery && (
                                            <>
                                                <CommandGroup heading="추천 옵션">
                                                    <CommandItem onSelect={() => toggleDestination('anywhere')} className="cursor-pointer h-14 text-base bg-primary/5">
                                                        <Checkbox checked={selectedDestinations.includes('anywhere')} className="mr-3 h-5 w-5 border-primary/20" />
                                                        <span className="font-black text-primary">어디든지 상관없음 📍</span>
                                                    </CommandItem>
                                                </CommandGroup>
                                                <div className="h-px bg-border my-1" />
                                                <CommandGroup heading="인기 목적지">
                                                    {destinations.map(option => (
                                                        <CommandItem key={option.id} onSelect={() => toggleDestination(option.id)} className="cursor-pointer h-14 text-base">
                                                            <Checkbox checked={selectedDestinations.includes(option.id)} className="mr-3" />
                                                            <span className="font-black text-muted-foreground mr-2">{option.label}</span>
                                                            <span className="text-xs text-muted-foreground/60">{option.sub}</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </>
                                        )}

                                        {searchQuery && searchResults.length > 0 && (
                                            <CommandGroup heading="검색 결과">
                                                {searchResults.map(option => (
                                                    <CommandItem key={option.id} onSelect={() => toggleDestination(option.id)} className="cursor-pointer h-14 text-base">
                                                        <Checkbox checked={selectedDestinations.includes(option.id)} className="mr-3" />
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-foreground leading-none">{option.label}</span>
                                                            <span className="text-[10px] text-muted-foreground mt-1">{option.sub}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* 3. Dates */}
                    <div className="flex flex-col gap-2 md:gap-3">
                        <Label className="text-sm md:text-md font-black text-muted-foreground uppercase ml-1">
                            {searchType === 'specific' ? '여행 일정' : '출발 시기'}
                        </Label>

                        {searchType === 'specific' ? (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="relative group bg-muted/50 hover:bg-card border-2 border-transparent hover:border-primary/30 rounded-2xl md:rounded-3xl transition-all h-[72px] md:h-[92px] flex items-center px-4 md:px-6 text-left w-full shadow-sm hover:shadow-md">
                                        <CalendarIcon className="text-muted-foreground group-hover:text-primary w-5 h-5 md:w-6 md:h-6 mr-3 md:mr-4 transition-colors shrink-0" />
                                        <div className="flex-col flex">
                                            {specificDate?.from ? (
                                                <span className="text-lg md:text-xl font-black text-foreground leading-tight tracking-tight">
                                                    {format(specificDate.from, "M/d")}
                                                    {tripType === "round" && ` - ${specificDate.to ? format(specificDate.to, "M/d") : "?"}`}
                                                </span>
                                            ) : <span className="text-xl md:text-2xl font-black text-muted-foreground/30">날짜 선택</span>}
                                        </div>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl border-border bg-card" align="center">
                                    <Calendar
                                        {...{
                                            locale: ko,
                                            initialFocus: true,
                                            mode: (tripType === "round" ? "range" : "single") as any,
                                            defaultMonth: specificDate?.from || new Date(),
                                            selected: specificDate,
                                            onSelect: setSpecificDate as any,
                                            numberOfMonths: isDesktop ? 2 : 1,
                                            fromDate: new Date() // 오늘 이전 날짜 선택 불가능하게 변경
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        ) : (
                            <div className="flex gap-2 h-[72px] md:h-[92px]">
                                {/* Flexible Search Mode UI */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="flex-1 bg-muted/50 hover:bg-card border-2 border-transparent hover:border-primary/30 rounded-2xl md:rounded-3xl flex flex-col justify-center px-4 md:px-5 text-left transition-all shadow-sm hover:shadow-md">
                                            <span className="text-[10px] md:text-[11px] text-muted-foreground/60 font-black uppercase mb-1">탐색 기간</span>
                                            <span className="text-base md:text-lg font-black text-foreground truncate tracking-tighter">
                                                {depRange?.from ? `${format(depRange.from, "M.d")}~${depRange.to ? format(depRange.to, "M.d") : ".."}` : "기간 설정"}
                                            </span>
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-3xl shadow-2xl border-border bg-card" align="center">
                                        <Calendar
                                            {...{
                                                mode: "range" as const,
                                                selected: depRange,
                                                onSelect: setDepRange as any,
                                                numberOfMonths: isDesktop ? 2 : 1,
                                                locale: ko,
                                                fromDate: new Date()
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>

                                {tripType === "round" && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="min-w-[100px] md:min-w-[120px] bg-primary/10 hover:bg-card border-2 border-primary/20 hover:border-primary/30 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center transition-all shadow-sm">
                                                <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary mb-1" />
                                                <span className="text-base md:text-xl font-black text-primary leading-none">
                                                    {stayDuration}일
                                                </span>
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-6 rounded-3xl shadow-2xl border-border bg-card">
                                            <div className="space-y-4">
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-sm font-black text-foreground">여행 기간 (체류 일수)</p>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[2, 3, 4, 5, 6, 7, 8, 10, 14].map((d) => (
                                                        <Button
                                                            key={d}
                                                            variant={stayDuration === d ? "default" : "outline"}
                                                            className={cn("h-10 font-bold rounded-xl text-xs", stayDuration === d ? "bg-primary" : "hover:bg-primary/10")}
                                                            onClick={() => setStayDuration(d)}
                                                        >
                                                            {d}일
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 4. Search Button */}
                    <div className="flex items-end pt-4 lg:pt-8 w-full lg:w-auto">
                        <Button
                            className="w-full lg:w-[130px] h-[72px] md:h-[92px] rounded-2xl md:rounded-3xl bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 flex md:flex-col items-center justify-center gap-2 md:gap-1 border-b-4 border-primary/20"
                            onClick={handleSearch}
                        >
                            <Search className="h-6 w-6 md:h-8 md:w-8" strokeWidth={4} />
                            <span className="text-sm md:text-xs font-black opacity-90">항공권 검색</span>
                        </Button>
                    </div>

                </div>
                )}
            </div>
        </div>
    )
}

function Separator({ className }: { className?: string }) {
    return <div className={cn("h-px bg-border w-full", className)} />
}
