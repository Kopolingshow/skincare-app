import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import MyProductsTab from "./MyProductsTab";
import AnalyticsTab from "./AnalyticsTab";
import AvatarUploader from "./AvatarUploader";
import EditProfileDialog from "./EditProfileDialog";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";




const getTodayKey = () => new Date().toISOString().split("T")[0];
const getTodayDayName = () => new Date().toLocaleDateString("ru-RU", { weekday: "long" }).toLowerCase();

const weeklyChecklist = {
  понедельник: {
    morning: ["cleanse", "tone", "moisturize"],
    evening: ["cleanse", "tone", "retinol", "moisturize"],
  },
  вторник: {
    morning: ["cleanse", "tone", "moisturize"],
    evening: ["cleanse", "tone", "serum", "moisturize"],
  },
  среда: {
    morning: ["cleanse", "tone", "moisturize"],
    evening: ["cleanse", "tone", "mask", "moisturize"],
  },
  четверг: {
    morning: ["cleanse", "tone", "moisturize"],
    evening: ["cleanse", "tone", "serum", "moisturize"],
  },
  пятница: {
    morning: ["cleanse", "tone", "moisturize"],
    evening: ["cleanse", "tone", "moisturize"],
  },
  суббота: {
    morning: ["cleanse", "tone", "moisturize"],
    evening: ["cleanse", "tone", "peeling", "moisturize"],
  },
  воскресенье: {
    morning: ["cleanse", "tone", "moisturize"],
    evening: ["cleanse", "tone", "moisturize"],
  },
};

export default function SkincareApp({ session, onLogout }) {
  const user = session.user;
  useEffect(() => {
    const syncUser = async () => {
      if (user) {
        const { error } = await supabase.from("users").upsert({
          id: user.id,
          created_at: new Date().toISOString(),
        });
        if (error) {
          console.error("Ошибка при синхронизации пользователя:", error.message);
        }
      }
    };
  
    syncUser();
  }, [user]);
  const [tripMode, setTripMode] = useState(false);
  const [userName, setUserName] = useState("");

useEffect(() => {
  const loadProfile = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", user.id)
      .single();

    if (!error && data?.display_name) {
      setUserName(data.display_name);
    }
  };

  if (user) loadProfile();
}, [user]);
  const [morningChecklist, setMorningChecklist] = useState({});
  const [eveningChecklist, setEveningChecklist] = useState({});
  const [morningCompleted, setMorningCompleted] = useState(false);
  const [eveningCompleted, setEveningCompleted] = useState(false);
  const [loadedMorningSteps, setLoadedMorningSteps] = useState(null);
  const [loadedEveningSteps, setLoadedEveningSteps] = useState(null);
  const today = getTodayKey();
  const todayDayName = getTodayDayName();
  const todayChecklist = weeklyChecklist[todayDayName] || {};
  const [isLoading, setIsLoading] = useState(true);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const checklistItemsMorning = useMemo(
    () => (tripMode ? ["tone", "moisturize"] : todayChecklist.morning || []),
    [tripMode, todayChecklist]
  );
  const checklistItemsEvening = useMemo(
    () => (tripMode ? ["tone", "moisturize"] : todayChecklist.evening || []),
    [tripMode, todayChecklist]
  );

  useEffect(() => {
    const loadProgress = async () => {
      const { data, error } = await supabase
        .from("progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      if (data) {
        setTripMode(!!data.trip_mode); // применяем сразу
        setLoadedMorningSteps(data.morning_steps || {});
        setLoadedEveningSteps(data.evening_steps || {});
        setMorningCompleted(!!data.morning_done);
        setEveningCompleted(!!data.evening_done);
      }
      setIsLoading(false);
    };

    if (user) loadProgress();
  }, [user, today]);

  useEffect(() => {
    const saveProgress = async () => {
      const { error } = await supabase.from("progress").upsert([
        {
          user_id: user.id,
          date: today,
          morning_done: morningCompleted,
          evening_done: eveningCompleted,
          done: morningCompleted && eveningCompleted,
          morning_steps: morningChecklist,
          evening_steps: eveningChecklist,
          trip_mode: tripMode,
        },
      ], {
        onConflict: ["user_id", "date"],
      });

      if (error) console.error("Ошибка сохранения:", error.message);
    };

    if (user && !isLoading) saveProgress();
  }, [morningChecklist, eveningChecklist, morningCompleted, eveningCompleted, tripMode, isLoading]);

  const toggleStep = (time, step) => {
    if (time === "morning") {
      setMorningChecklist((prev) => ({ ...prev, [step]: !prev[step] }));
    } else {
      setEveningChecklist((prev) => ({ ...prev, [step]: !prev[step] }));
    }
  };

  useEffect(() => {
    if (loadedMorningSteps && checklistItemsMorning.length > 0) {
      const filtered = {};
      checklistItemsMorning.forEach((key) => {
        filtered[key] = !!loadedMorningSteps[key];
      });
      setMorningChecklist(filtered);
    }
  }, [loadedMorningSteps, checklistItemsMorning]);

  useEffect(() => {
    if (loadedEveningSteps && checklistItemsEvening.length > 0) {
      const filtered = {};
      checklistItemsEvening.forEach((key) => {
        filtered[key] = !!loadedEveningSteps[key];
      });
      setEveningChecklist(filtered);
    }
  }, [loadedEveningSteps, checklistItemsEvening]);

  if (!user) return <div>Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
  <div className="max-w-md mx-auto px-6 py-6">
  <div className="flex justify-end mb-4">
  <Button
    variant="ghost"
    size="icon"
    className="rounded-full hover:bg-gray-100"
    onClick={() => window.location.reload()}
    title="Обновить данные"
  >
    <span className="text-xl">🔄</span>
  </Button>
</div>

      <h1 className="text-3xl font-bold text-center text-gray-900 mb-6 tracking-tight">
  Твой помощник в уходе
</h1>
      
          {user && (
  <div className="flex items-center justify-between mb-4">
   <div className="w-full bg-white rounded-2xl shadow-md px-4 py-3 flex items-center gap-4">
  <AvatarUploader user={user} displayName={userName} />
  <div className="flex flex-col">
    <span className="text-sm text-gray-500">Добро пожаловать,</span>
    <span className="text-lg font-semibold text-gray-900">{userName || "Гость"}</span>
  </div>
</div>

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setEditProfileOpen(true)}>
          Профиль
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            await supabase.auth.signOut();
            onLogout(); // обновляем сессию
          }}
        >
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <EditProfileDialog
      user={user}
      refreshProfile={async () => {
        const { data, error } = await supabase
          .from("users")
          .select("display_name")
          .eq("id", user.id)
          .single();
        if (!error && data?.display_name) {
          setUserName(data.display_name);
        }
      }}
      open={editProfileOpen}
      onOpenChange={setEditProfileOpen}
    />
  </div>
)}


<div className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between mb-4">
  <div className="flex items-center gap-3">
    <span className="text-xl">🧳</span>
    <span className="text-sm text-gray-800 font-medium">Режим путешествия</span>
  </div>
  <Switch checked={tripMode} onCheckedChange={setTripMode} />
</div>
      <Tabs defaultValue="checklist" className="w-full">
  <TabsList className="bg-gray-200 p-1 rounded-full flex justify-between mb-4">
    <TabsTrigger
      value="checklist"
      className="data-[state=active]:bg-white data-[state=active]:text-black flex-1 rounded-full text-center text-sm font-medium py-2 transition-all"
    >
      Чек-лист
    </TabsTrigger>
    <TabsTrigger
      value="products"
      className="data-[state=active]:bg-white data-[state=active]:text-black flex-1 rounded-full text-center text-sm font-medium py-2 transition-all"
    >
      Мои средства
    </TabsTrigger>
    <TabsTrigger
      value="analytics"
      className="data-[state=active]:bg-white data-[state=active]:text-black flex-1 rounded-full text-center text-sm font-medium py-2 transition-all"
    >
      Аналитика
    </TabsTrigger>
  </TabsList>

        
        <TabsContent value="products">
  <MyProductsTab user={user} />
</TabsContent>

<TabsContent value="analytics">
  <AnalyticsTab user={user} />
</TabsContent>
        <TabsContent value="checklist">
          <Card>
          <CardContent className="p-4 space-y-6">
  <div className="space-y-3">
    <h2 className="text-lg font-semibold text-gray-900">🧼 Утро</h2>
    {checklistItemsMorning.map((key) => (
      <div key={`morning-${key}`} className="flex items-center space-x-3">
        <Checkbox
          id={`morning-${key}`}
          checked={!!morningChecklist[key]}
          onCheckedChange={() => toggleStep("morning", key)}
          disabled={morningCompleted}
        />
        <label htmlFor={`morning-${key}`} className="text-sm text-gray-800">
          {key === "cleanse" && "Очищение"}
          {key === "tone" && "Тонизирование"}
          {key === "moisturize" && "Увлажнение"}
          {key === "retinol" && "Ретинол"}
          {key === "serum" && "Сыворотка"}
          {key === "mask" && "Маска"}
          {key === "peeling" && "Пилинг"}
        </label>
      </div>
    ))}
    <Button
      className={`w-full py-2 rounded-xl font-medium transition-all ${
        morningCompleted
          ? "bg-gray-200 text-gray-500 cursor-default"
          : "bg-black text-white hover:bg-gray-800"
      }`}
      onClick={() => setMorningCompleted(true)}
      disabled={
        morningCompleted ||
        !checklistItemsMorning.every((key) => morningChecklist[key])
      }
    >
      Утро выполнено
    </Button>
    {morningCompleted && (
  <div className="bg-green-100 text-green-800 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
    ✅ Утренний уход завершён
  </div>
)}
  </div>

  <div className="space-y-3 pt-6 border-t">
    <h2 className="text-lg font-semibold text-gray-900">🌙 Вечер</h2>
    {checklistItemsEvening.map((key) => (
      <div key={`evening-${key}`} className="flex items-center space-x-3">
        <Checkbox
          id={`evening-${key}`}
          checked={!!eveningChecklist[key]}
          onCheckedChange={() => toggleStep("evening", key)}
          disabled={eveningCompleted}
        />
        <label htmlFor={`evening-${key}`} className="text-sm text-gray-800">
          {key === "cleanse" && "Очищение"}
          {key === "tone" && "Тонизирование"}
          {key === "moisturize" && "Увлажнение"}
          {key === "retinol" && "Ретинол"}
          {key === "serum" && "Сыворотка"}
          {key === "mask" && "Маска"}
          {key === "peeling" && "Пилинг"}
        </label>
      </div>
    ))}
    <Button
      className={`w-full py-2 rounded-xl font-medium transition-all ${
        eveningCompleted
          ? "bg-gray-200 text-gray-500 cursor-default"
          : "bg-black text-white hover:bg-gray-800"
      }`}
      onClick={() => setEveningCompleted(true)}
      disabled={
        eveningCompleted ||
        !checklistItemsEvening.every((key) => eveningChecklist[key])
      }
    >
      Вечер выполнено
    </Button>
    {eveningCompleted && (
  <div className="bg-green-100 text-green-800 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
    🌙 Вечерний уход завершён
  </div>
)}

  </div>
</CardContent>

          </Card>
        </TabsContent>
      </Tabs>
  </div>
    
  </div>
);
}