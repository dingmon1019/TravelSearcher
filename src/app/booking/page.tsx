"use client"

import { CheckCircle2, Home, ArrowLeft, Calendar, Plane, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"

function BookingContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [bookingId, setBookingId] = useState("")
    
    const flightId = searchParams.get('id') || "FL123"
    const price = searchParams.get('price') || "0"

    useEffect(() => {
        // Generate a random booking ID
        setBookingId(Math.random().toString(36).substring(2, 10).toUpperCase())
    }, [])

    return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
            <div className="max-w-[500px] w-full bg-card rounded-[40px] shadow-2xl overflow-hidden border border-border">
                {/* Header with Success Animation/Icon */}
                <div className="bg-primary/5 p-12 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        <CheckCircle2 className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground">예약이 완료되었습니다!</h1>
                    <p className="text-muted-foreground font-medium mt-2">안전하고 즐거운 여행 되세요.</p>
                </div>

                {/* Booking Details */}
                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                <CreditCard className="h-3 w-3" />
                                예약 번호
                            </span>
                            <p className="text-lg font-black text-foreground">{bookingId}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 justify-end">
                                <Plane className="h-3 w-3" />
                                항공편
                            </span>
                            <p className="text-lg font-black text-foreground">{flightId}</p>
                        </div>
                    </div>

                    <div className="p-6 bg-muted/30 rounded-3xl space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-muted-foreground">총 결제 금액</span>
                            <span className="text-xl font-black text-primary">{parseInt(price).toLocaleString()}원</span>
                        </div>
                        <div className="h-[1px] bg-border/50 w-full"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-muted-foreground">결제 방식</span>
                            <span className="text-sm font-black text-foreground">신용카드 (일시불)</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button 
                            className="w-full h-14 rounded-2xl bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-black text-lg transition-all shadow-lg"
                            onClick={() => router.push('/')}
                        >
                            <Home className="mr-2 h-5 w-5" />
                            메인으로 돌아가기
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="w-full h-12 rounded-xl font-bold text-muted-foreground hover:text-foreground"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            이전 화면으로
                        </Button>
                    </div>
                </div>

                {/* Footer Tip */}
                <div className="p-6 bg-muted/10 border-t border-border/50 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground/60 leading-relaxed uppercase tracking-wider">
                        E-티켓은 입력하신 이메일로 발송되었습니다.<br/>
                        출발 24시간 전부터 웹 체크인이 가능합니다.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function BookingPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BookingContent />
        </Suspense>
    )
}
