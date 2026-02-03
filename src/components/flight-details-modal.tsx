"use client"

import { Plane, Clock, Briefcase, Info, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface FlightDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    flight: {
        airline: string
        flightNumber: string
        departureTime: string
        arrivalTime: string
        originCode: string
        destinationCode: string
        origin: string
        destination: string
        duration: string
        departureDate: string
        price: string
        stopCount: number
        aircraft?: string
        baggage?: string
        deepLink?: string
        provider?: string
        layovers?: Array<{ airport: string; duration: string }>
        returnInfo?: {
            airline: string
            flightNumber: string
            departureTime: string
            arrivalTime: string
            originCode: string
            destinationCode: string
            origin: string
            destination: string
            duration: string
            departureDate: string
            stopCount: number
            aircraft?: string
            baggage?: string
            layovers?: Array<{ airport: string; duration: string }>
        }
    }
}

function LegDetails({ title, leg, isReturn = false }: { title: string, leg: any, isReturn?: boolean }) {
    const date = new Date(leg.departureDate)
    const dayNames = ['일', '월', '화', '수', '목', '금', '토']
    const formattedDate = `${date.getMonth() + 1}월 ${date.getDate()}일 (${dayNames[date.getDay()]})`

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                        isReturn ? "bg-muted-foreground text-background" : "bg-primary text-primary-foreground"
                    )}>
                        {isReturn ? "오는편" : "가는편"}
                    </span>
                    <h3 className="font-bold text-lg">{title}</h3>
                </div>
                <span className="text-sm font-medium text-muted-foreground">{formattedDate}</span>
            </div>

            <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border before:rounded-full">
                {/* Departure */}
                <div className="relative">
                    <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 border-primary bg-background z-10"></div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black">{leg.departureTime}</span>
                            <span className="text-sm font-bold">{leg.originCode}</span>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">{leg.origin}</p>
                    </div>
                </div>

                {/* Flight Info / Layover */}
                <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <Plane className="h-4 w-4" />
                            <span>{leg.airline}</span>
                        </div>
                        <span className="text-muted-foreground font-medium">{leg.flightNumber}</span>
                        <div className="flex items-center gap-1.5 text-muted-foreground font-medium ml-auto">
                            <Clock className="h-4 w-4" />
                            <span>{leg.duration.replace('h', '시간').replace('m', '분')}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-2 border-t border-border/50">
                        {leg.aircraft && (
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase">
                                <Info className="h-3.5 w-3.5" />
                                <span>{leg.aircraft}</span>
                            </div>
                        )}
                        {leg.baggage && (
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase">
                                <Briefcase className="h-3.5 w-3.5" />
                                <span>{leg.baggage}</span>
                            </div>
                        )}
                    </div>

                    {leg.layovers && leg.layovers.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-dashed border-border flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-black uppercase">경유</span>
                            <p className="text-xs font-bold text-amber-800">
                                {leg.layovers[0].airport}에서 {leg.layovers[0].duration.replace('h', '시간').replace('m', '분')} 대기
                            </p>
                        </div>
                    )}
                </div>

                {/* Arrival */}
                <div className="relative">
                    <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 border-primary bg-background z-10"></div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black">{leg.arrivalTime}</span>
                            <span className="text-sm font-bold">{leg.destinationCode}</span>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">{leg.destination}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function FlightDetailsModal({ isOpen, onClose, flight }: FlightDetailsModalProps) {
    const router = useRouter()

    if (!flight) return null

    const handleBook = () => {
        if (flight.deepLink && flight.deepLink.startsWith('http')) {
            window.open(flight.deepLink, '_blank')
        } else {
            router.push(`/booking?id=${flight.flightNumber}&price=${flight.price.replace(/,/g, '')}`)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-background">
                <DialogHeader className="p-6 pb-0 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-2xl font-black tracking-tight">여정 상세 정보</DialogTitle>
                        <DialogDescription className="text-sm font-medium text-muted-foreground mt-1">
                            선택하신 항공권의 상세 일정을 확인하세요.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-10 overflow-y-auto max-h-[70vh] scrollbar-hide">
                    {/* Departure Leg */}
                    <LegDetails 
                        title={`${flight.originCode} → ${flight.destinationCode}`} 
                        leg={flight} 
                    />

                    {/* Return Leg if exists */}
                    {flight.returnInfo && (
                        <div className="pt-8 border-t border-border">
                            <LegDetails 
                                title={`${flight.returnInfo.originCode} → ${flight.returnInfo.destinationCode}`} 
                                leg={flight.returnInfo} 
                                isReturn 
                            />
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className="p-6 bg-muted/30 border-t border-border flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            {flight.provider ? `${flight.provider} 결제 금액` : "결제 금액"}
                        </span>
                        <span className="text-2xl font-black text-primary tracking-tighter">{flight.price}원</span>
                    </div>
                    <Button 
                        size="lg" 
                        className="h-14 px-10 rounded-2xl bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-black text-lg transition-all shadow-lg active:scale-95"
                        onClick={handleBook}
                    >
                        {flight.deepLink && flight.deepLink.startsWith('http') ? "예약 사이트로 이동" : "지금 예약하기"}
                        <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
