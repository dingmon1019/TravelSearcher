"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowDownAZ, Banknote, Clock } from "lucide-react"

interface SortHeaderProps {
    currentSort: string;
    onSortChange: (sort: string) => void;
}

export function SortHeader({ currentSort, onSortChange }: SortHeaderProps) {
    const sortOptions = [
        { id: 'price', label: '최저가순', icon: Banknote },
        { id: 'duration', label: '최단시간순', icon: Clock },
        { id: 'departure', label: '출발시간순', icon: ArrowDownAZ },
    ];

    return (
        <div className="flex items-center gap-2 mb-6 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-fit">
            {sortOptions.map((option) => (
                <Button
                    key={option.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-9 px-4 rounded-xl font-bold transition-all flex items-center gap-2",
                        currentSort === option.id
                            ? "bg-slate-900 text-white hover:bg-slate-800 shadow-md"
                            : "text-slate-500 hover:bg-slate-50"
                    )}
                    onClick={() => onSortChange(option.id)}
                >
                    <option.icon className="w-4 h-4" />
                    {option.label}
                </Button>
            ))}
        </div>
    );
}
