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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>←</Button>
        <h2 className="text-xl font-semibold">{format(currentMonth, "LLLL yyyy")}</h2>
        <Button variant="outline" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>→</Button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map(day => (
          <div key={day} className="text-sm text-center font-medium">{day}</div>
        ))}
        {days.map((day, i) => (
          <div key={i} className={`h-10 flex items-center justify-center text-sm rounded ${getDayStatus(day)}`}>
            {format(day, "d")}
          </div>
        ))}
      </div>

      <p className="text-sm">Дней использования: {daysSinceStart}</p>
      <p className="text-sm">Выполненных дней: {fullyCompletedDays}</p>
      </div>
   
  );
}
