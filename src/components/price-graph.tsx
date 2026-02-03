"use client"

import React, { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, TrendingDown } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { DayPriceTrend } from "@/lib/types/flight"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useMediaQuery } from "@/hooks/use-media-query"

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-foreground border-none rounded-xl shadow-2xl p-2 md:p-4 text-background">
                <p className="text-[8px] md:text-[10px] font-bold opacity-70 mb-0.5 md:mb-1 uppercase tracking-widest">
                    {payload[0].payload.date}
                </p>
                <p className="text-sm md:text-xl font-black tracking-tighter">
                    {payload[0].value.toLocaleString()}원
                </p>
            </div>
        )
    }
    return null
}

interface PriceGraphProps {
    currentPrice?: number;
    currentDate?: string;
}

export function PriceGraph({ currentPrice, currentDate }: PriceGraphProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const searchParams = useSearchParams()
    const [data, setData] = useState<DayPriceTrend[]>([])
    const [startIndex, setStartIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const pageSize = isDesktop ? 14 : 7 // 모바일에서는 7일치만 노출

    useEffect(() => {
        const fetchTrends = async () => {
            setLoading(true)
            try {
                const from = searchParams.get('from') || 'SEL'
                const to = searchParams.get('to') || 'TYO'
                const res = await fetch(`/api/flights/trends?from=${from}&to=${to}`)
                const json = await res.json()
                if (json.success) {
                    let trendData: DayPriceTrend[] = json.data

                    // [추가] 현재 검색된 최저가 데이터를 그래프 데이터에 강제 반영 (일관성 확보)
                    if (currentPrice && currentDate) {
                        const targetIdx = trendData.findIndex(d => d.date === currentDate)
                        if (targetIdx !== -1) {
                            // 이미 데이터가 있으면 더 낮은 가격으로 업데이트
                            trendData[targetIdx].price = Math.min(trendData[targetIdx].price, currentPrice)
                        } else {
                            // 데이터가 없으면 새로 추가하고 정렬
                            trendData.push({
                                date: currentDate,
                                price: currentPrice,
                                isWeekend: [0, 6].includes(new Date(currentDate).getDay())
                            })
                            trendData.sort((a, b) => a.date.localeCompare(b.date))
                        }
                    }

                    setData(trendData)
                    
                    // Find today's index or searched date's index
                    const focusDate = currentDate || new Date().toISOString().split('T')[0]
                    const focusIdx = trendData.findIndex(d => d.date >= focusDate)
                    const defaultIdx = focusIdx !== -1 
                        ? Math.max(0, focusIdx - Math.floor(pageSize / 2))
                        : Math.max(0, Math.floor(trendData.length / 2) - pageSize / 2)
                    
                    setStartIndex(Math.min(Math.max(0, trendData.length - pageSize), defaultIdx))
                }
            } catch (error) {
                console.error("Failed to fetch trends:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchTrends()
    }, [searchParams, pageSize, currentPrice, currentDate])

    const next = () => {
        setStartIndex(prev => Math.min(data.length - pageSize, prev + (isDesktop ? 7 : 3)))
    }

    const prev = () => {
        setStartIndex(prev => Math.max(0, prev - (isDesktop ? 7 : 3)))
    }

    const chartWidthPercent = data.length > 0 ? (data.length / pageSize) * 100 : 100
    const scrollOffset = data.length > 0 ? (startIndex / (data.length)) * 100 : 0

    const maxPrice = data.length > 0 ? Math.max(...data.map(d => d.price)) : 1000000
    const dayNames = ['일', '월', '화', '수', '목', '금', '토']

    // 현재 보이는 영역의 최저가 계산
    const visibleData = data.slice(startIndex, startIndex + pageSize)
    const visibleMinPrice = visibleData.length > 0 ? Math.min(...visibleData.map(d => d.price)) : 0

    if (loading) return (
        <Card className="h-[300px] flex items-center justify-center border-none shadow-none bg-muted/30">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-muted-foreground">최저가 추이 불러오는 중...</p>
            </div>
        </Card>
    )

    return (
        <Card className="border-none shadow-sm bg-card rounded-2xl md:rounded-3xl overflow-hidden mb-6 md:mb-8">
            <CardHeader className="flex flex-row items-center gap-4 md:gap-6 pb-2 px-4 md:px-6 pt-4 md:pt-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <TrendingDown className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-black text-foreground tracking-tight">최저가 추이</CardTitle>
                        <p className="text-xs font-bold text-muted-foreground">{pageSize}일 단위 가격 변동 리포트</p>
                    </div>
                </div>
                <div className="flex gap-1.5 p-1 bg-muted/50 rounded-xl border border-border">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={prev}
                        disabled={startIndex <= 0}
                        className="h-8 w-8 rounded-lg hover:bg-card hover:shadow-sm transition-all border border-border disabled:opacity-30 bg-card/50"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={next}
                        disabled={startIndex + pageSize >= data.length}
                        className="h-8 w-8 rounded-lg hover:bg-card hover:shadow-sm transition-all border border-border disabled:opacity-30 bg-card/50"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="h-[180px] md:h-[220px] p-0 relative overflow-hidden flex">
                {/* Fixed Y-Axis */}
                <div className="w-[45px] md:w-[55px] h-full z-20 bg-card border-r border-border">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[]} margin={{ top: 20, right: 0, left: 5, bottom: 45 }}>
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: isDesktop ? 12 : 9, fontWeight: 700, fill: 'currentColor', opacity: 0.5 }}
                                tickFormatter={(val) => `${Math.floor(val / 10000)}`}
                                domain={[0, maxPrice * 1.2]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Sliding Strip */}
                <div className="flex-1 overflow-hidden relative">
                    <motion.div
                        className="h-full"
                        style={{ width: `${chartWidthPercent}%` }}
                        animate={{ x: `-${scrollOffset}%` }}
                        transition={{ type: "spring", damping: 30, stiffness: 180, restDelta: 0.001 }}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
                                margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
                                barGap={8}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: isDesktop ? 13 : 9, fontWeight: 700, fill: 'currentColor', opacity: 0.7 }}
                                    tickFormatter={(val) => {
                                        const parts = val.split('-');
                                        if (!isDesktop) return `${parts[1]}/${parts[2]}`; // 모바일에서는 요일 생략
                                        const d = new Date(val);
                                        const dayStr = dayNames[d.getDay()];
                                        return `${parts[1]}/${parts[2]}(${dayStr})`;
                                    }}
                                    dy={5}
                                    interval={0}
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ fill: 'currentColor', opacity: 0.05, radius: 8 }}
                                    allowEscapeViewBox={{ x: true, y: true }}
                                />
                                <Bar dataKey="price" radius={[6, 6, 0, 0]} barSize={isDesktop ? 24 : 16}>
                                    {data.map((entry, index) => {
                                        const date = new Date(entry.date);
                                        const isSunday = date.getDay() === 0;
                                        const isSaturday = date.getDay() === 6;

                                        // 현재 보이는 영역 내에 있는지 확인
                                        const isInVisibleRange = index >= startIndex && index < startIndex + pageSize;
                                        // 보이는 영역 내의 최저가인지 확인
                                        const isLowest = isInVisibleRange && entry.price === visibleMinPrice;

                                        let fillColor = "currentColor";
                                        let fillOpacity = 0.1;
                                        
                                        if (isLowest) {
                                            fillColor = "#3b82f6"; // Primary blue
                                            fillOpacity = 1;
                                        } else if (isSunday) {
                                            fillColor = "#ef4444"; // Red
                                            fillOpacity = 0.2;
                                        } else if (isSaturday) {
                                            fillColor = "#3b82f6"; // Blue
                                            fillOpacity = 0.2;
                                        }

                                        return (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={fillColor}
                                                fillOpacity={fillOpacity}
                                                className="hover:fill-primary transition-all duration-300 cursor-pointer"
                                            />
                                        );
                                    })}
                                </Bar>
                                <YAxis hide domain={[0, maxPrice * 1.2]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                </div>
            </CardContent>
        </Card>
    )
}
    )
}
