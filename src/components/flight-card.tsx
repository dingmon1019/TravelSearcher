import { Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface FlightCardProps {
    airline: string
    flightNumber: string
    departureTime: string
    arrivalTime: string
    originCode: string
    destinationCode: string
    duration: string
    departureDate: string
    price: string
    stopCount: number
    returnInfo?: {
        airline: string
        flightNumber: string
        departureTime: string
        arrivalTime: string
        originCode: string
        destinationCode: string
        duration: string
        departureDate: string
        stopCount: number
    }
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

    return (
        <div className="flex-1 w-full flex items-center gap-6 sm:gap-8">
            <div className="flex flex-col text-center min-w-[70px]">
                <span className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">{departureTime}</span>
                <span className="text-xs font-bold text-slate-400">{originCode}</span>
            </div>

            <div className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-slate-600">{duration}</span>
                <div className="w-full flex items-center gap-2">
                    <div className="h-[2px] flex-1 bg-slate-100 rounded-full"></div>
                    <Plane className={cn(
                        "h-3 w-3 transform rotate-90",
                        isDirect ? "text-slate-200" : stopCount === 1 ? "text-amber-400" : "text-rose-500"
                    )} />
                    <div className="h-[2px] flex-1 bg-slate-100 rounded-full"></div>
                </div>
                <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap",
                    isDirect ? "text-slate-400 bg-slate-50" : stopCount === 1 ? "text-amber-700 bg-amber-50" : "text-rose-700 bg-rose-50 border border-rose-100"
                )}>
                    {isDirect ? "직항" : `경유 ${stopCount}회`}
                </span>
            </div>

            <div className="flex flex-col text-center min-w-[70px]">
                <span className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">{arrivalTime}</span>
                <span className="text-xs font-bold text-slate-400">{destinationCode}</span>
            </div>

            <div className="hidden md:block w-[1px] h-10 bg-slate-100 mx-1"></div>

            <div className="hidden md:flex flex-col min-w-[100px]">
                <span className="text-sm font-bold text-slate-800 tracking-tight">{airline}</span>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1 rounded-sm">{formattedDate}</span>
                    <span className="text-[10px] font-medium text-slate-400">{flightNumber}</span>
                </div>
            </div>
        </div>
    );
}

export function FlightCard({
    airline,
    flightNumber,
    departureTime,
    arrivalTime,
    originCode,
    destinationCode,
    duration,
    price,
    stopCount,
    departureDate,
    returnInfo,
}: FlightCardProps) {
    return (
        <Card className="hover:border-blue-500 transition-all cursor-pointer group shadow-sm hover:shadow-md rounded-2xl overflow-hidden border-slate-100">
            <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                    {/* Flight Info Section - 병렬 배치 */}
                    <div className="flex-1 p-5">
                        {returnInfo ? (
                            // 왕복: 가는편과 오는편을 좌우로 배치
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* 가는편 */}
                                <div className="flex-1 relative">
                                    <span className="inline-block mb-2 text-[10px] bg-blue-600 text-white px-2 py-1 rounded-md font-bold shadow-sm">
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
                                <div className="hidden md:block w-[1px] bg-slate-200 self-stretch"></div>
                                <div className="md:hidden h-[1px] bg-slate-200 w-full"></div>

                                {/* 오는편 */}
                                <div className="flex-1 relative">
                                    <span className="inline-block mb-2 text-[10px] bg-slate-600 text-white px-2 py-1 rounded-md font-bold shadow-sm">
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
                    <div className="bg-slate-50/50 p-5 lg:min-w-[200px] flex lg:flex-col items-center justify-between lg:justify-center gap-4 lg:border-l border-slate-100">
                        <div className="lg:text-center">
                            <span className="block text-2xl font-black text-blue-600 tracking-tighter">
                                {price}원
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {returnInfo ? "왕복 총액" : "편도 총액"}
                            </span>
                        </div>

                        <Button className="bg-slate-900 hover:bg-blue-600 text-white font-bold px-8 h-12 rounded-xl transition-all shadow-sm">
                            선택
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
