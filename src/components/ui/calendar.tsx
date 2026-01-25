"use client"

import * as React from "react"
import { DayPicker, DateRange, DayPickerProps } from "react-day-picker"
import { ko } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = DayPickerProps & {
  className?: string;
  classNames?: any;
  showOutsideDays?: boolean;
}

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const { selected, onSelect, mode = "range" } = props as any;
  const [range, setRange] = React.useState<any>(selected)
  const [hoveredDay, setHoveredDay] = React.useState<Date | undefined>()

  // Sync internal state when selected prop changes
  React.useEffect(() => {
    setRange(selected)
  }, [selected])

  const [viewMonth, setViewMonth] = React.useState<Date>(() => {
    // [FIX] selected가 Date 객체인지 확실히 확인하여 getFullYear 에러 방지
    let d: any = null;
    if (mode === "range") {
      d = (selected as DateRange)?.from;
    } else {
      // mode가 single인 경우, selected가 혹시 DateRange 객체일 가능성 처리
      d = selected instanceof Date ? selected : (selected as any)?.from || selected;
    }

    const finalDate = (d instanceof Date && !isNaN(d.getTime())) ? d : new Date();
    return new Date(finalDate.getFullYear(), finalDate.getMonth(), 1)
  })

  // previewRange is only relevant for range mode
  const previewRange = React.useMemo<any>(() => {
    if (mode !== "range") return selected
    const r = range as DateRange
    if (!r?.from || r?.to || !hoveredDay) return r
    const from = r.from
    const to = hoveredDay
    return from <= to ? { from, to } : { from: to, to: from }
  }, [range, hoveredDay, mode, selected])

  const year = viewMonth.getFullYear()
  const monthIndex = viewMonth.getMonth()

  const years = React.useMemo(() => {
    const base = new Date().getFullYear()
    return Array.from({ length: 11 }, (_, i) => base - 5 + i)
  }, [])

  const months = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]

  return (
    <div
      className={cn(
        "calendar-wrapper bg-white rounded-xl p-10 w-full max-w-[1100px] mx-auto",
        className
      )}
    >
      <div className="relative z-20 mb-6 flex items-center justify-between gap-3 h-10">
        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm cursor-pointer"
            value={year}
            onChange={(e) => {
              const y = Number(e.target.value)
              setViewMonth(new Date(y, monthIndex, 1))
            }}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm cursor-pointer"
            value={monthIndex}
            onChange={(e) => {
              const m = Number(e.target.value)
              setViewMonth(new Date(year, m, 1))
            }}
          >
            {months.map((label, idx) => (
              <option key={label} value={idx}>{label}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline" }), "h-9 px-3")}
          onClick={() => {
            const d = new Date()
            setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1))
          }}
        >
          오늘
        </button>
      </div>

      <style jsx global>{`
        .calendar-wrapper .rdp-day, .calendar-wrapper .rdp-weekday { padding-inline: 8px; }
        .calendar-wrapper .rdp-table { table-layout: fixed; width: 100%; border-collapse: separate; border-spacing: 0 10px; }
        .calendar-wrapper .rdp-day_button > span { width: 38px; height: 38px; border-radius: 9999px; display: inline-flex; align-items: center; justify-content: center; margin: auto; transition: all 0.2s; pointer-events: none; }
        .calendar-wrapper .rdp-day_button:hover > span { background: rgb(241 245 249); }
        .calendar-wrapper .rdp-selected .rdp-day_button > span,
        .calendar-wrapper .rdp-range_start .rdp-day_button > span,
        .calendar-wrapper .rdp-range_end .rdp-day_button > span { background: rgb(79 70 229) !important; color: #fff !important; font-weight: 600 !important; box-shadow: 0 2px 10px rgba(79, 70, 229, 0.25) !important; }
        .calendar-wrapper .rdp-range_middle .rdp-day_button > span { color: rgb(30 58 138) !important; font-weight: 600 !important; }
        .calendar-wrapper .rdp-day { position: relative; height: 48px; }
        .calendar-wrapper .rdp-range_middle::before, .calendar-wrapper .rdp-range_start::before, .calendar-wrapper .rdp-range_end::before { content: ""; position: absolute; top: 0; bottom: 0; left: 0; right: 0; background: rgba(148, 163, 184, 0.2); z-index: 0; pointer-events: none; }
        .calendar-wrapper .rdp-day_button { position: relative; z-index: 10; background: transparent !important; width: 100%; height: 100%; }
        .calendar-wrapper .rdp-outside { opacity: 0.25 !important; }
        .calendar-wrapper .rdp-sun { color: #ef4444 !important; }
        .calendar-wrapper .rdp-sat { color: #3b82f6 !important; }
      `}</style>

      <DayPicker
        locale={ko}
        weekStartsOn={0}
        showOutsideDays={showOutsideDays}
        mode={mode as any}
        fixedWeeks
        selected={previewRange}
        onSelect={(next: any, selectedDay: Date, activeModifiers: any, e: any) => {
          if (mode === "range") {
            const r = range as DateRange
            let updatedRange = next as DateRange;
            if (r?.from && r?.to && selectedDay) {
              updatedRange = { from: selectedDay, to: undefined };
            }
            setRange(updatedRange ?? undefined);
            if (onSelect) (onSelect as any)(updatedRange, selectedDay, activeModifiers, e);
          } else {
            setRange(next);
            if (onSelect) (onSelect as any)(next, selectedDay, activeModifiers, e);
          }
        }}
        onDayMouseEnter={setHoveredDay}
        onDayMouseLeave={() => setHoveredDay(undefined)}
        formatters={{
          formatCaption: (date) => `${date.getFullYear()}년 ${date.getMonth() + 1}월`,
          formatWeekdayName: (date) => ["일", "월", "화", "수", "목", "금", "토"][date.getDay()],
        }}
        modifiers={{
          sunday: (date) => date.getDay() === 0,
          saturday: (date) => date.getDay() === 6,
        }}
        modifiersClassNames={{
          sunday: "rdp-sun",
          saturday: "rdp-sat",
        }}
        month={viewMonth}
        onMonthChange={setViewMonth}
        classNames={{
          months: "flex flex-col sm:flex-row gap-14 w-full justify-between",
          month: "space-y-4 flex-1",
          caption: "relative flex items-center justify-center h-10 mb-4 px-4",
          caption_label: "text-lg font-semibold text-slate-900",
          nav: "absolute inset-y-0 left-0 right-0 flex items-center justify-between px-1",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-9 w-9 bg-transparent p-0 hover:bg-slate-100 border-slate-200 rounded-full transition-colors"
          ),
          table: "w-full",
          day_button: cn(
            buttonVariants({ variant: "ghost" }),
            "w-full h-full p-0 rounded-none hover:bg-slate-50 transition-none"
          ),
          ...classNames,
        }}
        {...props}
      />
    </div>
  )
}
