"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek, 
  endOfWeek,
  isSameMonth,
  isSameDay,
  isWithinInterval
} from "date-fns";
import type { Day, StartOfWeekOptions } from "date-fns";

// 型定義はpage.tsxからインポートするのが望ましいが、簡単のため再定義
interface InitialData {
  todayTime: number;
  startOfWeekTime: number;
  endOfWeekTime: number;
  startOfMonthTime: number;
  weekNumber: number;
}

interface CalendarCardProps {
  data: InitialData;
}

export function CalendarCard({ data }: CalendarCardProps) {
  const { 
    todayTime, 
    startOfWeekTime, 
    endOfWeekTime, 
    startOfMonthTime,
    weekNumber
  } = data;

  const today = new Date(todayTime);
  const monthPeriodStart = new Date(startOfMonthTime);
  const currentWeek = { start: new Date(startOfWeekTime), end: new Date(endOfWeekTime) };

  // カレンダーの表示範囲を計算（月の初日から週の初日まで）
  const weekOptions: StartOfWeekOptions<Date> = { weekStartsOn: 0 as Day }; // カレンダーは日曜日開始、土曜日終了
  const calendarStart = startOfWeek(monthPeriodStart, weekOptions);
  const calendarEnd = endOfWeek(endOfMonth(monthPeriodStart), weekOptions);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekdays = ["土", "日", "月", "火", "水", "木", "金"];

  const getDayClassName = (day: Date) => {
    let classes = 'calendar-day';
    if (isSameMonth(day, monthPeriodStart)) {
      classes += ' day-in-month';
    } else {
      classes += ' day-other-month';
    }
    if (isWithinInterval(day, currentWeek)) {
      classes += ' day-in-week';
    }
    if (isSameDay(day, today)) {
      classes += ' day-today';
    }
    return classes;
  };

  return (
    <Card>
      <CardContent id="calendar-container" className="pt-6">
        <div className="calendar-header">
          <h2 className="text-2xl font-semibold">
            {format(monthPeriodStart, "yyyy年 M月期")} ({`第${weekNumber}週`})
          </h2>
        </div>
        <div className="calendar-weekdays">
          {weekdays.map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="calendar-grid">
          {days.map(day => (
            <div key={day.toString()} className={getDayClassName(day)}>
              {format(day, "d")}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
