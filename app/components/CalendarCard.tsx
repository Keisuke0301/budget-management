"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import type { StartOfWeekOptions } from "date-fns";

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
    startOfMonthTime,
    weekNumber
  } = data;

  const today = new Date(todayTime);
  const monthPeriodStart = new Date(startOfMonthTime);
  const highlightedWeek = {
    start: startOfWeek(today, { weekStartsOn: 6 }), // 土曜開始
    end: endOfWeek(today, { weekStartsOn: 6 }) // 金曜終了
  };

  // カレンダーの表示範囲を計算（月の初日から週の初日まで）
  const weekOptions: StartOfWeekOptions = { weekStartsOn: 0 }; // カレンダー表示は日曜開始・土曜終了
  const calendarStart = startOfWeek(monthPeriodStart, weekOptions);
  const calendarEnd = endOfWeek(endOfMonth(monthPeriodStart), weekOptions);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  const getDayClassName = (day: Date) => {
    let classes = 'calendar-day';
    if (isSameMonth(day, monthPeriodStart)) {
      classes += ' day-in-month';
    } else {
      classes += ' day-other-month';
    }
    if (isWithinInterval(day, highlightedWeek)) {
      classes += ' day-in-week';
    }
    if (isSameDay(day, today)) {
      classes += ' day-today';
    }
    return classes;
  };

  return (
    <Card className="pt-2 pb-4 gap-2">
      <CardHeader className="py-2 px-4">
        <h2 className="text-lg font-bold">
          {format(monthPeriodStart, "yyyy年 M月期")} ({`第${weekNumber}週`})
        </h2>
      </CardHeader>
      <CardContent id="calendar-container" className="pt-0 px-4 pb-0">
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
