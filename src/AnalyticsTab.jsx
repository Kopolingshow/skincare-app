import { useEffect, useState } from "react";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, subMonths, addMonths, isSameMonth } from "date-fns";
import { supabase } from "./supabaseClient";
import { Button } from "@/components/ui/button";
import { differenceInDays, parseISO } from "date-fns";

export default function AnalyticsTab({ user }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [progress, setProgress] = useState([]);
  const accountCreated = parseISO(user?.created_at);
  const daysSinceStart = differenceInDays(new Date(), accountCreated);
  const fullyCompletedDays = progress.filter((p) => p.morning_done && p.evening_done).length;

  useEffect(() => {
    if (!user) return;
    const fetchProgress = async () => {
      const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");

      const { data } = await supabase
        .from("progress")
        .select("date, morning_done, evening_done")
        .eq("user_id", user.id)
        .gte("date", start)
        .lte("date", end);

      setProgress(data || []);
    };
    fetchProgress();
  }, [user, currentMonth]);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

  const getDayStatus = (date) => {
    const dayStr = format(date, "yyyy-MM-dd");
    const entry = progress.find((d) => d.date === dayStr);
    if (entry?.morning_done && entry?.evening_done) return "bg-green-200";
    return "bg-red-200";
  };

  const totalDone = progress.filter(p => p.morning_done && p.evening_done).length;

  return (
    <div className="space-y-6">
      {/* Навигация по месяцам */}
      <div className="flex items-center justify-between">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
          className="rounded-full"
        >
          ←
        </Button>
        <h2 className="text-xl font-semibold text-gray-900">
          {format(currentMonth, "LLLL yyyy")}
        </h2>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
          className="rounded-full"
        >
          →
        </Button>
      </div>
  
      {/* Календарь */}
      <div className="grid grid-cols-7 gap-2">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
          <div key={day} className="text-xs text-center text-gray-500">
            {day}
          </div>
        ))}
  
        {days.map((day, i) => {
          const dayStr = format(day, "yyyy-MM-dd");
          const entry = progress.find((d) => d.date === dayStr);
          const isCurrentMonth = isSameMonth(day, currentMonth);
  
          const bgColor = entry?.morning_done && entry?.evening_done
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800";
  
          return (
            <div
              key={i}
              className={`h-10 flex items-center justify-center text-sm font-medium rounded-full ${
                isCurrentMonth ? bgColor : "text-gray-300"
              }`}
            >
              {format(day, "d")}
            </div>
          );
        })}
      </div>
  
      {/* Статистика */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-100 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Дней использования</p>
          <p className="text-lg font-semibold text-gray-900">{daysSinceStart}</p>
        </div>
        <div className="bg-gray-100 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Полностью выполнено в этом месяце</p>
          <p className="text-lg font-semibold text-gray-900">{fullyCompletedDays}</p>
        </div>
      </div>
    </div>
  );
  
}
