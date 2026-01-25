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

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border-none rounded-xl shadow-2xl p-4 text-white">
                <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">
                    {payload[0].payload.date}
                </p>
                <p className="text-xl font-black tracking-tighter">
                    {payload[0].value.toLocaleString()}원
                </p>
            </div>
        )
    }
    return null
}

export function PriceGraph() {
    const searchParams = useSearchParams()
    const [data, setData] = useState<DayPriceTrend[]>([])
    const [startIndex, setStartIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const pageSize = 14

    useEffect(() => {
        const fetchTrends = async () => {
            setLoading(true)
            try {
                const from = searchParams.get('from') || 'SEL'
                const to = searchParams.get('to') || 'TYO'
                const res = await fetch(`/api/flights/trends?from=${from}&to=${to}`)
                const json = await res.json()
                if (json.success) {
                    setData(json.data)
                    // Find today's index or start from middle
                    const defaultIdx = Math.max(0, Math.floor(json.data.length / 2) - pageSize / 2)
                    setStartIndex(Math.min(json.data.length - pageSize, defaultIdx))
                }
            } catch (error) {
                console.error("Failed to fetch trends:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchTrends()
    }, [searchParams])

    const next = () => {
        setStartIndex(prev => Math.min(data.length - pageSize, prev + 7))
    }

    const prev = () => {
        setStartIndex(prev => Math.max(0, prev - 7))
    }

    const chartWidthPercent = data.length > 0 ? (data.length / pageSize) * 100 : 100
    const scrollOffset = data.length > 0 ? (startIndex / (data.length)) * 100 : 0

    const maxPrice = data.length > 0 ? Math.max(...data.map(d => d.price)) : 1000000
    const dayNames = ['일', '월', '화', '수', '목', '금', '토']

    // 현재 보이는 영역의 최저가 계산
    const visibleData = data.slice(startIndex, startIndex + pageSize)
    const visibleMinPrice = visibleData.length > 0 ? Math.min(...visibleData.map(d => d.price)) : 0

    if (loading) return (
        <Card className="h-[300px] flex items-center justify-center border-none shadow-none bg-slate-50/50">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-slate-400">최저가 추이 불러오는 중...</p>
            </div>
        </Card>
    )

    return (
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden mb-8">
            <CardHeader className="flex flex-row items-center gap-6 pb-2 px-6 pt-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <TrendingDown className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-black text-slate-900 tracking-tight">최저가 추이</CardTitle>
                        <p className="text-xs font-bold text-slate-400">14일 단위 가격 변동 리포트</p>
                    </div>
                </div>
                <div className="flex gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={prev}
                        disabled={startIndex <= 0}
                        className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm transition-all border border-slate-300 disabled:opacity-30 bg-white/50"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={next}
                        disabled={startIndex + pageSize >= data.length}
                        className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm transition-all border border-slate-300 disabled:opacity-30 bg-white/50"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="h-[220px] p-0 relative overflow-hidden flex">
                {/* Fixed Y-Axis */}
                <div className="w-[55px] h-full z-20 bg-white border-r border-slate-50">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[]} margin={{ top: 20, right: 0, left: 10, bottom: 45 }}>
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }}
                                tickFormatter={(val) => `${Math.floor(val / 10000)}만`}
                                width={45}
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
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 13, fontWeight: 700, fill: '#64748b' }}
                                    tickFormatter={(val) => {
                                        const d = new Date(val);
                                        const parts = val.split('-');
                                        const dayStr = dayNames[d.getDay()];
                                        return `${parts[1]}/${parts[2]} (${dayStr})`;
                                    }}
                                    dy={10}
                                    interval={0}
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ fill: '#f8fafc', radius: 8 }}
                                    allowEscapeViewBox={{ x: true, y: true }}
                                />
                                <Bar dataKey="price" radius={[6, 6, 0, 0]} barSize={24}>
                                    {data.map((entry, index) => {
                                        const date = new Date(entry.date);
                                        const isSunday = date.getDay() === 0;
                                        const isSaturday = date.getDay() === 6;

                                        // 현재 보이는 영역 내에 있는지 확인
                                        const isInVisibleRange = index >= startIndex && index < startIndex + pageSize;
                                        // 보이는 영역 내의 최저가인지 확인
                                        const isLowest = isInVisibleRange && entry.price === visibleMinPrice;

                                        let fillColor = "#e2e8f0";
                                        if (isLowest) fillColor = "#3b82f6";
                                        else if (isSunday) fillColor = "#fecaca";
                                        else if (isSaturday) fillColor = "#bfdbfe";

                                        return (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={fillColor}
                                                className="hover:fill-blue-500 transition-all duration-300 cursor-pointer"
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
