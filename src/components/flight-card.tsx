import { Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { FlightDetailsModal } from "./flight-details-modal"

interface FlightCardProps {
    airline: string
    flightNumber: string
    departureTime: string
    arrivalTime: string
    originCode: string
    destinationCode: string
    origin?: string
    destination?: string
    duration: string
    departureDate: string
    price: string
    stopCount: number
    aircraft?: string
    baggage?: string
    layovers?: Array<{ airport: string; duration: string }>
    returnInfo?: {
        airline: string
        flightNumber: string
        departureTime: string
        arrivalTime: string
        originCode: string
        destinationCode: string
        origin?: string
        destination?: string
        duration: string
        departureDate: string
        stopCount: number
        aircraft?: string
        baggage?: string
        layovers?: Array<{ airport: string; duration: string }>
    }
    index?: number
    deepLink?: string
    provider?: string
}

function FlightLeg({
    airline, flightNumber, departureTime, arrivalTime, originCode, destinationCode, duration, stopCount, departureDate
}: any) {
    const isDirect = stopCount === 0;
    const date = departureDate ? new Date(departureDate) : new Date();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const isValidDate = !isNaN(date.getTime());
    const formattedDate = isValidDate
        ? `${date.getMonth() + 1}월 ${date.getDate()}일 (${dayNames[date.getDay()]})`
        : '일정 확인 필요';

    // 소요 시간 한글화 (2h 30m -> 2시간 30분)
    const formattedDuration = duration
        .replace('h', '시간')
        .replace('m', '분')
        .replace(/\s+/g, ' ');

    return (
        <div className="flex-1 w-full flex items-center gap-6 sm:gap-10">
            {/* 출발 시간 */}
            <div className="flex flex-col text-center min-w-[70px] md:min-w-[90px]">
                <span className="font-black text-2xl md:text-3xl text-foreground tracking-tight">{departureTime}</span>
                <span className="text-xs md:text-sm font-bold text-muted-foreground mt-0.5">{originCode}</span>
            </div>

            {/* 비행 경로 및 소요 시간 */}
            <div className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[11px] md:text-sm font-bold text-muted-foreground">{formattedDuration}</span>
                <div className="w-full flex items-center gap-2">
                    <div className="h-[2px] flex-1 bg-border rounded-full"></div>
                    <Plane className={cn(
                        "h-4 w-4 transform rotate-90",
                        isDirect ? "text-muted-foreground/30" : stopCount === 1 ? "text-amber-400" : "text-rose-500"
                    )} />
                    <div className="h-[2px] flex-1 bg-border rounded-full"></div>
                </div>
                <span className={cn(
                    "text-[10px] md:text-xs px-2 md:px-3 py-0.5 md:py-1 rounded-full font-bold whitespace-nowrap",
                    isDirect ? "text-muted-foreground bg-muted" : stopCount === 1 ? "text-amber-700 bg-amber-500/10" : "text-rose-700 bg-rose-500/10 border border-rose-100"
                )}>
                    {isDirect ? "직항" : `경유 ${stopCount}회`}
                </span>
            </div>

            {/* 도착 시간 */}
            <div className="flex flex-col text-center min-w-[70px] md:min-w-[90px]">
                <span className="font-black text-2xl md:text-3xl text-foreground tracking-tight">{arrivalTime}</span>
                <span className="text-xs md:text-sm font-bold text-muted-foreground mt-0.5">{destinationCode}</span>
            </div>

            {/* 상세 정보 (데스크탑) */}
            <div className="hidden md:block w-[1px] h-12 bg-border mx-2"></div>

            <div className="hidden md:flex flex-col min-w-[120px]">
                <span className="text-base font-bold text-foreground tracking-tight mb-1">{airline}</span>
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md w-fit">{formattedDate}</span>
                    <span className="text-[11px] font-semibold text-muted-foreground ml-1">{flightNumber}</span>
                </div>
            </div>
        </div>
    );
}

export function FlightCard(props: FlightCardProps) {
    const {
        airline,
        flightNumber,
        departureTime,
        arrivalTime,
        originCode,
        destinationCode,
        origin = "서울/인천",
        destination = "도쿄/나리타",
        duration,
        price,
        stopCount,
        departureDate,
        returnInfo,
        index,
        provider,
    } = props
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    const handleSelect = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsDetailsOpen(true)
    }

    const flightData = {
        ...props,
        origin,
        destination,
        returnInfo: returnInfo ? {
            ...returnInfo,
            origin: returnInfo.origin || destination,
            destination: returnInfo.destination || origin
        } : undefined
    }

    return (
        <>
            <Card
                className="hover:border-primary transition-all cursor-pointer group shadow-sm hover:shadow-md rounded-2xl overflow-hidden border-border relative bg-card"
                onClick={handleSelect}
            >
                {index !== undefined && (
                    <div className="absolute top-0 left-0 bg-foreground text-background text-[10px] font-black px-2 py-1 rounded-br-lg z-10 shadow-sm">
                        {index + 1}
                    </div>
                )}
                <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row">
                        {/* Flight Info Section - 병렬 배치 */}
                        <div className="flex-1 p-5">
                            {returnInfo ? (
                                // 왕복: 가는편과 오는편을 좌우로 배치
                                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                                    {/* 가는편 */}
                                    <div className="flex-1 relative">
                                        <span className="inline-block mb-1.5 text-[9px] md:text-[10px] bg-primary text-primary-foreground px-1.5 md:px-2 py-0.5 md:py-1 rounded-md font-bold shadow-sm">
                                            가는편
                                        </span>
                                        <FlightLeg
                                            airline={airline}
                                            flightNumber={flightNumber}
                                            departureTime={departureTime}
                                            arrivalTime={arrivalTime}
                                            originCode={originCode}
                                            destinationCode={destinationCode}
                                            duration={duration}
                                            stopCount={stopCount}
                                            departureDate={departureDate}
                                        />
                                    </div>

                                    {/* 구분선 */}
                                    <div className="hidden md:block w-[1px] bg-border self-stretch"></div>
                                    <div className="md:hidden h-[1px] bg-border w-full my-1"></div>

                                    {/* 오는편 */}
                                    <div className="flex-1 relative">
                                        <span className="inline-block mb-1.5 text-[9px] md:text-[10px] bg-muted-foreground text-background px-1.5 md:px-2 py-0.5 md:py-1 rounded-md font-bold shadow-sm">
                                            오는편
                                        </span>
                                        <FlightLeg {...returnInfo} />
                                    </div>
                                </div>
                            ) : (
                                // 편도: 단일 여정
                                <FlightLeg
                                    airline={airline}
                                    flightNumber={flightNumber}
                                    departureTime={departureTime}
                                    arrivalTime={arrivalTime}
                                    originCode={originCode}
                                    destinationCode={destinationCode}
                                    duration={duration}
                                    stopCount={stopCount}
                                    departureDate={departureDate}
                                />
                            )}
                        </div>

                        {/* Price & Action Section */}
                        <div className="bg-muted/30 p-4 md:p-5 lg:min-w-[180px] flex lg:flex-col items-center justify-between lg:justify-center gap-3 lg:gap-4 lg:border-l border-border">
                            <div className="lg:text-center text-left">
                                <span className="block text-2xl md:text-3xl font-black text-primary tracking-tighter leading-none">
                                    {price}원
                                </span>
                                <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    {returnInfo ? "왕복 총액" : "편도 총액"}
                                </span>
                                {provider && (
                                    <div className="mt-1">
                                        <span className={cn(
                                            "text-[8px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-tight",
                                            provider === 'Amadeus' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                        )}>
                                            via {provider}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <Button
                                className="bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-bold px-6 md:px-8 h-10 md:h-12 rounded-xl transition-all shadow-sm"
                                onClick={handleSelect}
                            >
                                선택
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <FlightDetailsModal 
                isOpen={isDetailsOpen} 
                onClose={() => setIsDetailsOpen(false)} 
                flight={flightData as any}
            />
        </>
    )
}
