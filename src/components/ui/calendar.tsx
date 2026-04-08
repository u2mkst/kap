
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface CalendarProps {
  className?: string
  renderDay?: (date: Date) => React.ReactNode
}

export function Calendar({ className, renderDay }: CalendarProps) {
  const [viewDate, setViewDate] = React.useState(new Date())
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const lastDateOfMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1))
  }

  if (!isMounted) return <div className="w-[320px] h-[350px] bg-card animate-pulse rounded-xl" />

  const today = new Date()
  const isToday = (d: number) => {
    return (
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  const days = ["일", "월", "화", "수", "목", "금", "토"]

  return (
    <div className={cn("calendar w-full max-w-[320px] bg-card rounded-[12px] shadow-[0_5px_20px_rgba(0,0,0,0.1)] overflow-hidden border border-border", className)}>
      {/* Header */}
      <div className="header flex justify-between items-center p-[15px] bg-[#4a69bd] text-white">
        <button onClick={prevMonth} className="bg-none border-none text-white text-[18px] cursor-pointer hover:opacity-70 transition-opacity">◀</button>
        <div className="monthYear font-bold text-[16px]">{year}년 {month + 1}월</div>
        <button onClick={nextMonth} className="bg-none border-none text-white text-[18px] cursor-pointer hover:opacity-70 transition-opacity">▶</button>
      </div>

      {/* Days Labels */}
      <div className="days grid grid-cols-7 text-center">
        {days.map((day) => (
          <div key={day} className="p-[10px] font-bold bg-[#f1f2f6] dark:bg-muted text-[12px] text-foreground/70">
            {day}
          </div>
        ))}
      </div>

      {/* Dates Grid */}
      <div className="dates grid grid-cols-7 text-center">
        {/* Empty slots for the first week */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="p-[12px]" />
        ))}
        
        {/* Date slots */}
        {Array.from({ length: lastDateOfMonth }).map((_, i) => {
          const dateNum = i + 1
          const currentIterationDate = new Date(year, month, dateNum)
          
          return (
            <div 
              key={dateNum} 
              className="relative p-[12px] text-[14px] cursor-pointer hover:bg-muted/50 transition-colors flex flex-col items-center justify-center min-h-[48px]"
            >
              <span className={cn(
                "z-10 w-8 h-8 flex items-center justify-center transition-all",
                isToday(dateNum) ? "bg-[#4a69bd] text-white rounded-full font-bold" : "text-foreground font-medium"
              )}>
                {dateNum}
              </span>
              {renderDay && (
                <div className="absolute bottom-1 w-full flex justify-center">
                  {renderDay(currentIterationDate)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
