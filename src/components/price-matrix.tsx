"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Mock data generator for the matrix
const generateMatrixData = () => {
    const today = new Date();
    const data = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        // Random price between 200,000 and 400,000 similar to real flight prices
        const price = Math.floor(Math.random() * (400000 - 200000) + 200000);
        // Randomly mark some as 'cheapest'
        const isCheapest = price < 230000;

        data.push({
            date: `${date.getMonth() + 1}/${date.getDate()}`,
            day: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
            price,
            isCheapest
        });
    }
    return data;
};

export function PriceMatrix() {
    const data = generateMatrixData();

    return (
        <Card className="mb-6">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                    📅 2박 3일 최저가 매트릭스 (출발일 기준)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-2">
                    {data.map((item, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all hover:bg-zinc-100 hover:scale-105",
                                item.isCheapest
                                    ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm shadow-blue-100"
                                    : "bg-white border-slate-100 text-slate-600 shadow-sm"
                            )}
                        >
                            <span className="text-sm font-bold mb-1">{item.date} ({item.day})</span>
                            <span className={cn(
                                "text-base font-black",
                                item.isCheapest ? "text-blue-600" : "text-slate-900"
                            )}>
                                {Math.round(item.price / 10000)}만
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
