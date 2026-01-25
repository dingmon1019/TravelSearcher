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

export function SearchForm() {
    // Trip Type state
    const [tripType, setTripType] = React.useState<"round" | "oneway" | any>("round")

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
    const [locationOptions, setLocationOptions] = React.useState<LocationOption[]>([])

    React.useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await fetch('/api/locations')
                const data = await res.json()
                if (data.success) {
                    const anywhere = { id: 'anywhere', label: '어디든지 상관없음 📍', sub: '전 세계 최저가 검색', type: 'group' as const }
                    setLocationOptions([anywhere, ...data.data])
                }
            } catch (err) {
                console.error("Failed to load locations", err)
            }
        }
        fetchLocations()
    }, [])

    const toggleDeparture = (id: string) => {
        setSelectedDepartures([id])
        setIsDepartureOpen(false)
    }

    const toggleDestination = (id: string) => {
        setSelectedDestinations(prev => {
            // 1. 이미 선택된 경우 제거 (토글 오프)
            if (prev.includes(id)) {
                return prev.filter(x => x !== id)
            }

            // 2. '어디든지' 선택 시 기존 모두 제거하고 'anywhere'만 설정
            if (id === 'anywhere') {
                setIsDestinationOpen(false)
                return ['anywhere']
            }

            // 3. 일반 목적지 선택 시 '어디든지' 제거
            return [...prev.filter(x => x !== 'anywhere'), id]
        })
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
        // Validation
        if (selectedDepartures.length === 0) {
            toast.error("출발지를 선택해주세.", { description: "출발지는 필수 입력 한목입니다." })
            return
        }

        const destinations = selectedDestinations.length === 0 ? ['anywhere'] : selectedDestinations

        if (searchType === "specific") {
            if (!specificDate?.from) {
                toast.error("가는 날을 선택해주세요.")
                return
            }
            if (tripType === "round" && !specificDate.to) {
                toast.error("오는 날을 선택해주세요.")
                return
            }
        } else {
            // Flexible Search Mode
            if (!depRange?.from || !depRange?.to) {
                toast.error("탐색 기간을 선택해주세요.", { description: "시작일과 종료일을 모두 선택해야 합니다." })
                return
            }

            if (tripType === "round") {
                // Stay Duration vs Window Range Validation
                const windowDays = Math.ceil((depRange.to.getTime() - depRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
                if (stayDuration > windowDays) {
                    toast.error("체류 기간이 너무 깁니다.", {
                        description: `선택하신 탐색 기간(${windowDays}일)보다 체류 기간(${stayDuration}일)이 더 깁니다.`
                    })
                    return
                }
            }
        }

        const params = new URLSearchParams()
        params.set("from", selectedDepartures.join(","))
        params.set("to", destinations.join(","))
        params.set("tripType", tripType)
        params.set("adults", passengers.adults.toString())
        params.set("children", passengers.children.toString())
        params.set("infants", passengers.infants.toString())
        params.set("seatClass", seatClass)
        params.set("minPrice", priceRange[0].toString())
        params.set("maxPrice", priceRange[1].toString())

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
            <h1 className="text-4xl md:text-5xl font-extrabold text-center text-slate-900 mb-8 tracking-tight">
                최저가 항공권, <span className="text-blue-600">가장 스마트하게</span> 찾는 법
            </h1>

            {/* Main Search Card */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 p-6 md:p-8">

                {/* Upper Controls */}
                <div className="flex flex-wrap items-center justify-start gap-3 mb-8">
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "rounded-xl px-4 font-bold transition-all",
                                tripType === "round" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-900"
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
                                tripType === "oneway" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-900"
                            )}
                            onClick={() => setTripType("oneway")}
                        >
                            편도
                        </Button>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "rounded-xl px-4 font-bold transition-all",
                                searchType === "specific" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900"
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
                                searchType === "flexible" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900"
                            )}
                            onClick={() => setSearchType("flexible")}
                        >
                            날짜 유연하게
                        </Button>
                    </div>

                    <Popover open={isPriceOpen} onOpenChange={setIsPriceOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="h-10 rounded-2xl border-slate-200 bg-white font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 px-4">
                                <Wallet className="w-4 h-4 text-slate-400" />
                                {formatPrice(priceRange[0])} ~ {priceRange[1] >= 2000000 ? "무제한" : formatPrice(priceRange[1])}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[320px] p-6 rounded-3xl shadow-2xl border-slate-100">
                            <div className="space-y-6">
                                <p className="text-xs font-bold text-slate-400 uppercase">가격 범위 설정</p>

                                {/* Numeric Inputs for Price */}
                                <div className="grid grid-cols-2 gap-3 mb-2">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] text-slate-400 ml-1">최소 가격(원)</Label>
                                        <Input
                                            type="number"
                                            value={minPriceInput}
                                            onChange={(e) => handleMinPriceChange(e.target.value)}
                                            className="h-10 rounded-xl font-bold bg-slate-50 border-none ring-0 focus:bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] text-slate-400 ml-1">최대 가격(원)</Label>
                                        <Input
                                            type="number"
                                            value={maxPriceInput}
                                            onChange={(e) => handleMaxPriceChange(e.target.value)}
                                            className="h-10 rounded-xl font-bold bg-slate-50 border-none ring-0 focus:bg-white"
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

                                <div className="flex items-center justify-between text-sm font-black text-slate-900 border-t border-slate-50 pt-4">
                                    <span>{formatPrice(priceRange[0])}</span>
                                    <span>{priceRange[1] >= 2000000 ? "무제한" : formatPrice(priceRange[1])}</span>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Popover open={isPassengerOpen} onOpenChange={setIsPassengerOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="h-10 rounded-2xl border-slate-200 bg-white font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 px-4">
                                <Users className="w-4 h-4 text-slate-400" />
                                {`승객 ${passengers.adults + passengers.children + passengers.infants}명 · ${seatClass === "economy" ? "일반석" : seatClass === "business" ? "비즈니스석" : "일등석"
                                    }`}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[320px] p-6 rounded-3xl shadow-2xl border-slate-100">
                            <div className="space-y-6">
                                <p className="text-xs font-bold text-slate-400 uppercase">승객 선택</p>
                                {[
                                    { label: '성인', sub: '만 12세 이상', key: 'adults', min: 1 },
                                    { label: '소아', sub: '만 2세 ~ 11세', key: 'children', min: 0 },
                                    { label: '유아', sub: '만 2세 미만', key: 'infants', min: 0 }
                                ].map((type) => (
                                    <div key={type.key} className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800">{type.label}</span>
                                            <span className="text-[10px] text-slate-400">{type.sub}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Button
                                                variant="outline" size="icon" className="h-8 w-8 rounded-full border-slate-200"
                                                onClick={() => setPassengers(p => ({ ...p, [type.key]: Math.max(type.min, (p as any)[type.key] - 1) }))}
                                                disabled={(passengers as any)[type.key] <= type.min}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </Button>
                                            <span className="font-black text-lg w-4 text-center">{(passengers as any)[type.key]}</span>
                                            <Button
                                                variant="outline" size="icon" className="h-8 w-8 rounded-full border-slate-200"
                                                onClick={() => setPassengers(p => ({ ...p, [type.key]: Math.min(6, (p as any)[type.key] + 1) }))}
                                                disabled={(passengers as any)[type.key] >= 6}
                                            >
                                                <Plus className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">좌석 등급</p>
                                    <Select value={seatClass} onValueChange={setSeatClass}>
                                        <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 bg-slate-50/50 font-bold">
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
                </div>

                {/* Main Inputs Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_auto_1.1fr_1.3fr_auto] gap-3 lg:gap-6 items-center">

                    {/* 1. Departure */}
                    <div className="flex flex-col gap-3">
                        <Label className="text-md font-black text-slate-500 uppercase ml-1 flex items-center gap-2">
                            출발지 <span className="text-[15px] text-blue-500 opacity-70">(한 곳만 선택 가능)</span>
                        </Label>
                        <Popover open={isDepartureOpen} onOpenChange={setIsDepartureOpen}>
                            <PopoverTrigger asChild>
                                <button className="relative group bg-slate-50 hover:bg-white border-2 border-slate-50 hover:border-blue-200 rounded-3xl transition-all h-[92px] flex items-center px-6 text-left w-full overflow-hidden shadow-sm hover:shadow-md">
                                    <MapPin className="text-slate-400 group-hover:text-blue-600 w-6 h-6 mr-4 transition-colors shrink-0" />
                                    <div className="flex-1 overflow-hidden">
                                        {selectedDepartures.length > 0 ? (
                                            <div className="flex items-center">
                                                <span className="text-2xl font-black text-slate-900 truncate">
                                                    {locationOptions.find(o => o.id === selectedDepartures[0])?.label.split(' ')[0]}
                                                </span>
                                                <div
                                                    role="button"
                                                    className="ml-3 p-1 hover:bg-red-50 rounded-full transition-colors flex items-center justify-center cursor-pointer group/close"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedDepartures([]);
                                                    }}
                                                >
                                                    <X className="w-5 h-5 text-slate-300 group-hover:text-red-500 transition-colors" />
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-2xl font-black text-slate-200">출발도시</span>
                                        )}
                                    </div>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-[400px] shadow-2xl rounded-3xl overflow-hidden border-slate-100" align="start">
                                <Command>
                                    <CommandInput placeholder="출발 예정 도시/공항 검색..." className="h-14 text-base border-none ring-0" />
                                    <CommandList className="max-h-[350px]">
                                        <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                                        <CommandGroup heading="인기 공항/지역">
                                            {locationOptions.filter(o => o.id !== 'anywhere' && o.type === 'group').map(option => (
                                                <CommandItem key={option.id} onSelect={() => toggleDeparture(option.id)} className="cursor-pointer h-14 text-base">
                                                    <div className="w-6 mr-2 flex justify-center">
                                                        <MapPin className={cn("w-4 h-4", selectedDepartures.includes(option.id) ? "text-blue-600" : "text-slate-300")} />
                                                    </div>
                                                    <span className="font-black text-slate-800 mr-2">{option.label}</span>
                                                    <span className="text-xs text-slate-400">{option.sub}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        <Separator className="my-1" />
                                        <CommandGroup heading="모든 도시">
                                            {locationOptions.filter(o => o.id !== 'anywhere' && o.type === 'city').map(option => (
                                                <CommandItem key={option.id} onSelect={() => toggleDeparture(option.id)} className="cursor-pointer h-14 text-base">
                                                    <div className="w-6 mr-2 flex justify-center">
                                                        <MapPin className={cn("w-4 h-4", selectedDepartures.includes(option.id) ? "text-blue-600" : "text-slate-300")} />
                                                    </div>
                                                    <span className="font-bold text-slate-800">{option.label}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex justify-center -my-3 lg:my-0 lg:-mx-3 z-10 pt-8">
                        <Button
                            variant="ghost" size="icon"
                            className="bg-white hover:bg-blue-600 hover:text-white border-2 border-slate-100 shadow-2xl rounded-full h-12 w-12 transition-all duration-300 active:rotate-180 hover:scale-110"
                            onClick={swapLocations}
                        >
                            <ArrowLeftRight className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* 2. Destination */}
                    <div className="flex flex-col gap-3">
                        <Label className="text-md font-black text-slate-500 uppercase ml-1">도착지</Label>
                        <Popover open={isDestinationOpen} onOpenChange={setIsDestinationOpen}>
                            <PopoverTrigger asChild>
                                <button className="relative group bg-slate-50 hover:bg-white border-2 border-slate-50 hover:border-blue-200 rounded-3xl transition-all h-[92px] flex items-center px-6 text-left w-full overflow-hidden shadow-sm hover:shadow-md">
                                    <Globe className="text-slate-400 group-hover:text-blue-600 w-6 h-6 mr-4 transition-colors shrink-0" />
                                    <div className="flex-1 overflow-hidden">
                                        {selectedDestinations.length > 0 ? (
                                            <div className="flex gap-2 overflow-x-auto no-scrollbar items-center">
                                                {selectedDestinations.map(id => {
                                                    const item = locationOptions.find(o => o.id === id)
                                                    return (
                                                        <Badge
                                                            key={id}
                                                            variant="secondary"
                                                            className="whitespace-nowrap px-3 py-1.5 text-base font-black bg-blue-50 text-blue-700 hover:bg-blue-100 border-none rounded-xl group/badge cursor-default"
                                                            onClick={(e) => e.stopPropagation()} // 뱃지 클릭 시 팝오버 열림 방지
                                                        >
                                                            {item?.label.split(' ')[0]}
                                                            <div
                                                                role="button"
                                                                className="ml-2 p-0.5 hover:bg-blue-200 rounded-full transition-colors flex items-center justify-center cursor-pointer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleDestination(id);
                                                                }}
                                                            >
                                                                <X className="w-5 h-5 text-blue-300 hover:text-blue-700" />
                                                            </div>
                                                        </Badge>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <span className="text-2xl font-black text-slate-200">도착도시 / 어디든지</span>
                                        )}
                                    </div>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-[400px] shadow-2xl rounded-3xl overflow-hidden border-slate-100" align="start">
                                <Command>
                                    <CommandInput placeholder="어디로 떠나시나요? 도시/국가 검색..." className="h-14 text-base border-none ring-0" />
                                    <CommandList className="max-h-[350px]">
                                        <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                                        <CommandGroup heading="추천 옵션">
                                            <CommandItem onSelect={() => toggleDestination('anywhere')} className="cursor-pointer h-14 text-base bg-blue-50/30">
                                                <Checkbox checked={selectedDestinations.includes('anywhere')} className="mr-3 h-5 w-5 border-blue-200" />
                                                <span className="font-black text-blue-700">어디든지 상관없음 📍</span>
                                                <span className="text-[10px] ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md font-black">BEST</span>
                                            </CommandItem>
                                        </CommandGroup>
                                        <Separator className="my-1" />
                                        <CommandGroup heading="지역별 탐색">
                                            {locationOptions.filter(o => o.id !== 'anywhere' && o.type === 'group').map(option => (
                                                <CommandItem key={option.id} onSelect={() => toggleDestination(option.id)} className="cursor-pointer h-14 text-base">
                                                    <Checkbox checked={selectedDestinations.includes(option.id)} className="mr-3" />
                                                    <span className="font-black text-slate-700 mr-2">{option.label}</span>
                                                    <span className="text-xs text-slate-400">{option.sub}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        <Separator className="my-1" />
                                        <CommandGroup heading="인기 취항지">
                                            {locationOptions.filter(o => o.id !== 'anywhere' && o.type === 'city').map(option => (
                                                <CommandItem key={option.id} onSelect={() => toggleDestination(option.id)} className="cursor-pointer h-14 text-base">
                                                    <Checkbox checked={selectedDestinations.includes(option.id)} className="mr-3" />
                                                    <span className="font-bold text-slate-800">{option.label}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* 3. Dates */}
                    <div className="flex flex-col gap-3">
                        <Label className="text-md font-black text-slate-500 uppercase ml-1">
                            {searchType === 'specific' ? '여행 일정' : '출발 시기'}
                        </Label>

                        {searchType === 'specific' ? (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="relative group bg-slate-50 hover:bg-white border-2 border-slate-50 hover:border-blue-200 rounded-3xl transition-all h-[92px] flex items-center px-6 text-left w-full shadow-sm hover:shadow-md">
                                        <CalendarIcon className="text-slate-400 group-hover:text-blue-600 w-6 h-6 mr-4 transition-colors shrink-0" />
                                        <div className="flex-col flex">
                                            {specificDate?.from ? (
                                                <span className="text-xl font-black text-slate-900 leading-tight tracking-tight">
                                                    {format(specificDate.from, "M월 d일")}
                                                    {tripType === "round" && ` - ${specificDate.to ? format(specificDate.to, "M월 d일") : "귀국일?"}`}
                                                </span>
                                            ) : <span className="text-2xl font-black text-slate-200">날짜 선택하기</span>}
                                            {tripType === "oneway" && <span className="text-[11px] text-blue-500 font-extrabold uppercase mt-1">편도 여정</span>}
                                        </div>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-[2.5rem] overflow-hidden shadow-2xl border-slate-100" align="center">
                                    <Calendar
                                        {...{
                                            locale: ko,
                                            initialFocus: true,
                                            mode: (tripType === "round" ? "range" : "single") as any,
                                            defaultMonth: specificDate?.from,
                                            selected: specificDate,
                                            onSelect: setSpecificDate as any,
                                            numberOfMonths: 2
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        ) : (
                            <div className="flex gap-3 h-[92px]">
                                {/* Flexible Search Mode UI */}
                                {tripType === "round" ? (
                                    <>
                                        {/* 1. Total Search Period */}
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button className="flex-1 bg-slate-50 hover:bg-white border-2 border-slate-50 hover:border-blue-200 rounded-3xl flex flex-col justify-center px-5 text-left transition-all shadow-sm hover:shadow-md">
                                                    <span className="text-[11px] text-slate-400 font-black uppercase mb-1">전체 탐색 기간</span>
                                                    <span className="text-lg font-black text-slate-900 truncate tracking-tighter">
                                                        {depRange?.from ? `${format(depRange.from, "M.d")} ~ ${depRange.to ? format(depRange.to, "M.d") : "선택"}` : "탐색 기간 설정"}
                                                    </span>
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 rounded-3xl shadow-2xl border-slate-100" align="center">
                                                <Calendar
                                                    {...{
                                                        mode: "range" as const,
                                                        selected: depRange,
                                                        onSelect: setDepRange as any,
                                                        numberOfMonths: 2, // 탐색 기간이 길 수 있으므로 2달 표시
                                                        locale: ko
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>

                                        {/* 2. Stay Duration */}
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button className="min-w-[120px] bg-blue-50 hover:bg-white border-2 border-blue-100 hover:border-blue-200 rounded-3xl flex flex-col items-center justify-center transition-all shadow-sm">
                                                    <Clock className="w-5 h-5 text-blue-500 mb-1" />
                                                    <span className="text-xl font-black text-blue-700 leading-none">
                                                        {stayDuration - 1}박 {stayDuration}일
                                                    </span>
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-6 rounded-3xl shadow-2xl border-slate-100">
                                                <div className="space-y-4">
                                                    <div className="flex flex-col gap-1">
                                                        <p className="text-sm font-black text-slate-800">여행 기간 (체류 일수)</p>
                                                        <p className="text-[10px] text-slate-400">설정하신 '전체 탐색 기간' 내에서 해당 일수만큼의 여정을 추천합니다.</p>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {[2, 3, 4, 5, 6, 7, 8, 10, 14].map((d) => (
                                                            <Button
                                                                key={d}
                                                                variant={stayDuration === d ? "default" : "outline"}
                                                                className={cn(
                                                                    "h-12 font-black rounded-xl text-xs transition-all",
                                                                    stayDuration === d ? "bg-blue-600 shadow-lg shadow-blue-600/20" : "hover:bg-blue-50 border-slate-100"
                                                                )}
                                                                onClick={() => setStayDuration(d)}
                                                            >
                                                                {d - 1}박 {d}일
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </>
                                ) : (
                                    /* One-way Flexible: only Departure Window */
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="flex-1 bg-slate-50 hover:bg-white border-2 border-slate-50 hover:border-blue-200 rounded-3xl flex flex-col justify-center px-6 text-left transition-all shadow-sm hover:shadow-md">
                                                <span className="text-[11px] text-slate-400 font-black uppercase mb-1">가는 날 범위</span>
                                                <span className="text-xl font-black text-slate-900 truncate tracking-tighter">
                                                    {depRange?.from ? `${format(depRange.from, "M.d")} ~ ${depRange.to ? format(depRange.to, "M.d") : "선택"}` : "언제든 출발"}
                                                </span>
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 rounded-3xl shadow-2xl border-slate-100" align="center">
                                            <Calendar
                                                {...{
                                                    mode: "range" as const,
                                                    selected: depRange,
                                                    onSelect: setDepRange as any,
                                                    numberOfMonths: 2,
                                                    locale: ko
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 4. Search Button */}
                    <div className="flex items-end pt-8">
                        <Button
                            className="w-full lg:w-[130px] h-[92px] rounded-3xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-2xl shadow-blue-600/30 transition-all hover:scale-[1.05] active:scale-95 flex flex-col items-center justify-center gap-1 border-b-4 border-blue-800"
                            onClick={handleSearch}
                        >
                            <Search className="h-8 w-8" strokeWidth={4} />
                            <span className="text-xs font-black opacity-90">항공권 검색</span>
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    )
}

function Separator({ className }: { className?: string }) {
    return <div className={cn("h-px bg-slate-100 w-full", className)} />
}
