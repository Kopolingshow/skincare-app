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
    <div className="bg-background min-h-screen overflow-y-auto">
    <div className="max-w-xl mx-auto p-4">
      <div className="flex justify-end mb-2">
        <Button size="sm" variant="ghost" onClick={() => window.location.reload()}>
          🔄 Обновить
        </Button>
      </div>
          <h1 className="text-3xl font-serif text-center text-[#d48c72] mb-2">
            Персональный уход за кожей
          </h1>
      
      {user && (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center space-x-4">
    <AvatarUploader user={user} displayName={userName} />
      <div>
       
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
  refreshProfile={() => {
    const fetchName = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", user.id)
        .single();
      if (!error && data?.display_name) {
        setUserName(data.display_name);
      }
    };
    fetchName();
  }}
  open={editProfileOpen}
  onOpenChange={setEditProfileOpen}
/>
  </div>
)}

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">Режим путешествия</span>
          <Switch checked={tripMode} onCheckedChange={setTripMode} />
        </div>
        <div className="flex items-center gap-4">
        
         
        </div>
      </div>

      <Tabs defaultValue="checklist" className="w-full">
        <TabsList className="grid grid-cols-3 mb-3">
          <TabsTrigger value="checklist">Чек-лист</TabsTrigger>
          <TabsTrigger value="products">Мои средства</TabsTrigger>
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products">
  <MyProductsTab user={user} />
</TabsContent>

<TabsContent value="analytics">
  <AnalyticsTab user={user} />
</TabsContent>
        <TabsContent value="checklist">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h2 className="text-xl font-medium">Утро</h2>
              {checklistItemsMorning.map((key) => (
                <div key={`morning-${key}`} className="flex items-center space-x-2">
                  <Checkbox
                    id={`morning-${key}`}
                    checked={!!morningChecklist[key]}
                    onCheckedChange={() => toggleStep("morning", key)}
                    disabled={morningCompleted}
                  />
                  <label htmlFor={`morning-${key}`} className="capitalize">
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
                variant="secondary"
                onClick={() => setMorningCompleted(true)}
                disabled={
                  morningCompleted ||
                  !checklistItemsMorning.every((key) => morningChecklist[key])
                }
              >
                Утро выполнено
              </Button>

              <h2 className="text-xl font-medium pt-4">Вечер</h2>
              {checklistItemsEvening.map((key) => (
                <div key={`evening-${key}`} className="flex items-center space-x-2">
                  <Checkbox
                    id={`evening-${key}`}
                    checked={!!eveningChecklist[key]}
                    onCheckedChange={() => toggleStep("evening", key)}
                    disabled={eveningCompleted}
                  />
                  <label htmlFor={`evening-${key}`} className="capitalize">
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
                variant="secondary"
                onClick={() => setEveningCompleted(true)}
                disabled={
                  eveningCompleted ||
                  !checklistItemsEvening.every((key) => eveningChecklist[key])
                }
              >
                Вечер выполнено
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
  </div>
    
  </div>
);
}