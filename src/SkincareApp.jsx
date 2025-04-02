import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import MyProductsTab from "./MyProductsTab";
import AnalyticsTab from "./AnalyticsTab";
import ChecklistWizard from "./ChecklistWizard";
import AvatarUploader from "./AvatarUploader";
import EditProfileDialog from "./EditProfileDialog";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const convertArrayToChecklistObject = (array) => {
  return array.reduce((acc, id) => ({ ...acc, [id]: false }), {});
};






export default function SkincareApp({ session, onLogout }) {
  
  const user = session.user;
  const [checklistSetupOpen, setChecklistSetupOpen] = useState(false);
  const [checklistWizardProps, setChecklistWizardProps] = useState({
    initialStep: 0,
    singleDayMode: false,
    isTrip: false
  });
  
const getTodayKey = () => new Date().toISOString().split("T")[0];
const getTodayDayName = () => new Date().toLocaleDateString("ru-RU", { weekday: "long" }).toLowerCase();
const getDateFromWeekdayIndex = (index) => {
  const today = new Date();
  const currentIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const diff = index - currentIndex;
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);
  return targetDate.toISOString().split("T")[0];
};


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
const [morningChecklist, setMorningChecklist] = useState([]);
const [eveningChecklist, setEveningChecklist] = useState([]);
const [morningOrder, setMorningOrder] = useState([]);
const [eveningOrder, setEveningOrder] = useState([]);
const [allProducts, setAllProducts] = useState([]);
  const [morningCompleted, setMorningCompleted] = useState(false);
  const [eveningCompleted, setEveningCompleted] = useState(false);
  const [loadedMorningSteps, setLoadedMorningSteps] = useState(null);
  const [loadedEveningSteps, setLoadedEveningSteps] = useState(null);
  const today = getTodayKey();
  const englishDays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const todayDayName = englishDays[new Date().getDay()];
const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const [selectedDayIndex, setSelectedDayIndex] = useState(
  new Date().getDay() === 0 ? 6 : new Date().getDay() - 1 // Воскресенье — последний
);
const selectedDayName = daysOfWeek[selectedDayIndex];

const changeDay = async (offset) => {
  const newIndex = selectedDayIndex + offset;
  if (newIndex >= 0 && newIndex <= 6) {
    setSelectedDayIndex(newIndex);
    await fetchChecklist(daysOfWeek[newIndex]); // сразу загружаем чек-листы
  }
};


const fetchChecklist = async (dayNameOverride = null) => {
  const dayToUse = dayNameOverride || selectedDayName;

  // Обновляем выбранный день, если передан dayNameOverride
  if (dayNameOverride) {
    const index = daysOfWeek.findIndex((d) => d === dayNameOverride);
    if (index !== -1) setSelectedDayIndex(index);
  }

  const { data, error } = await supabase
    .from("checklists")
    .select("id, day, type, product_ids, order")
    .eq("user_id", user.id)
    .eq("day", dayToUse)
    .eq("is_trip", tripMode);

  if (error) {
    console.error("Ошибка загрузки чек-листа:", error.message);
    return;
  }

  const morning = data.find((item) => item.type === "morning");
  const evening = data.find((item) => item.type === "evening");
  setMorningOrder(morning?.order || []);
setEveningOrder(evening?.order || []);

setMorningChecklist(
  morning?.product_ids
    ? convertArrayToChecklistObject(morning.product_ids)
    : {}
);

setEveningChecklist(
  evening?.product_ids
    ? convertArrayToChecklistObject(evening.product_ids)
    : {}
);


};

const ensureWeeklyChecklist = async () => {
  if (!user) return false;

  const { data: existingChecklists, error: fetchError } = await supabase
    .from("checklists")
    .select("day, type, is_trip, product_ids")
    .eq("user_id", user.id);

  if (fetchError) {
    console.error("❌ Ошибка при загрузке чек-листов:", fetchError.message);
    return false;
  }

  const requiredDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const requiredTypes = ["morning", "evening"];
  const missing = [];

  for (const day of requiredDays) {
    for (const type of requiredTypes) {
      const exists = existingChecklists.some(
        (c) =>
          c.day === day &&
          c.type === type &&
          c.is_trip === tripMode &&
          Array.isArray(c.product_ids) &&
          c.product_ids.length > 0
      );
      if (!exists) {
        missing.push({ day, type });
      }
    }
  }

  if (missing.length === 0) {
    console.log("✅ Неделя уже заполнена полностью");
    return false;
  }

  const { data: previous, error: prevError } = await supabase
    .from("checklists")
    .select("type, product_ids, order")
    .eq("user_id", user.id)
    .eq("is_trip", tripMode)
    .order("id", { ascending: false })
    .limit(100);

  if (prevError || !previous || previous.length === 0) {
    console.warn("🔁 Нет шаблонов для автозаполнения");
    return false;
  }

  const sourceMorning = previous.find((item) => item.type === "morning");
  const sourceEvening = previous.find((item) => item.type === "evening");

  if (!sourceMorning || !sourceEvening) {
    console.warn("⚠️ Не хватает шаблонов для утреннего и вечернего ухода");
    return false;
  }

  const inserts = [];

  for (const { day, type } of missing) {
    const source = type === "morning" ? sourceMorning : sourceEvening;

    inserts.push({
      user_id: user.id,
      day,
      type,
      is_trip: tripMode,
      product_ids: source.product_ids.map((id) => parseInt(id)),
      order: source.order || [],
    });
  }

  const { error: insertError } = await supabase
    .from("checklists")
    .upsert(inserts, {
      onConflict: ["user_id", "day", "type", "is_trip"],
    });

  if (insertError) {
    console.error("❌ Ошибка при автозаполнении:", insertError.message);
    return false;
  } else {
    console.log("📋 Автоматически создан чек-лист на пропущенные дни:", missing);
    return true;
  }
};
useEffect(() => {
  const ensureWeeklyChecklistAndLoad = async () => {
    if (!user) return;

    const inserted = await ensureWeeklyChecklist(); // вернёт true, если были вставки
    await fetchChecklist(); // всегда обновляем

    if (inserted) {
      console.log("🔄 Обновлены данные после автозаполнения");
    }
  };

  ensureWeeklyChecklistAndLoad();
}, [user, selectedDayIndex, tripMode]);

  
  
  
  
  
  useEffect(() => {
    const ensureWeeklyChecklistAndLoad = async () => {
      if (!user) return;
  
      const inserted = await ensureWeeklyChecklist(); // вернём true, если были вставки
      await fetchChecklist(); // всегда обновляем
  
      if (inserted) {
        console.log("🔄 Обновлены данные после автозаполнения");
      }
    };
  
    ensureWeeklyChecklistAndLoad();
  }, [user, selectedDayIndex, tripMode]);

  useEffect(() => {
    const loadAllProducts = async () => {
      if (!user) return;
  
      const { data, error } = await supabase
  .from("products")
  .select("id, name, time_of_use")
  .eq("user_id", user.id);
  
      if (error) {
        console.error("Ошибка при загрузке продуктов:", error.message);
      } else {
        setAllProducts(data);
        console.log("📦 Средства из базы:", data);
      }
    };
  
    loadAllProducts();
  }, [user]);
  
  
  const [isLoading, setIsLoading] = useState(true);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const resolvedMorningSteps = useMemo(() => {
    return morningOrder
      .map((id) => allProducts.find((p) => p.id === id))
      .filter(Boolean);
  }, [allProducts, morningOrder]);
  
  const resolvedEveningSteps = useMemo(() => {
    return eveningOrder
      .map((id) => allProducts.find((p) => p.id === id))
      .filter(Boolean);
  }, [allProducts, eveningOrder]);
  
  
  
  
  useEffect(() => {
    const loadProgress = async () => {
      const { data } = await supabase
        .from("progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", getDateFromWeekdayIndex(selectedDayIndex))
        .single();
  
      if (data) {
        setTripMode(!!data.trip_mode);
        setMorningChecklist(data.morning_steps || {});
        setEveningChecklist(data.evening_steps || {});
        setMorningCompleted(!!data.morning_done);
        setEveningCompleted(!!data.evening_done);
      } else {
        setMorningChecklist({});
        setEveningChecklist({});
        setMorningCompleted(false);
        setEveningCompleted(false);
      }
      setIsLoading(false);
    };
  
    if (user) loadProgress();
  }, [user, selectedDayIndex, tripMode]);
  

  
    

  const toggleStep = async (time, step) => {
    const checklist = time === "morning" ? morningChecklist : eveningChecklist;
    const newChecklist = { ...checklist, [step]: !checklist[step] };
  
    if (time === "morning") {
      setMorningChecklist(newChecklist);
    } else {
      setEveningChecklist(newChecklist);
    }
  
    await supabase.from("progress").upsert({
      user_id: user.id,
      date: getDateFromWeekdayIndex(selectedDayIndex),
      morning_steps: time === "morning" ? newChecklist : morningChecklist,
      evening_steps: time === "evening" ? newChecklist : eveningChecklist,
      morning_done: morningCompleted,
      evening_done: eveningCompleted,
      trip_mode: tripMode,
    }, { onConflict: ["user_id", "date"] });
  };
  
  

  if (!user) return <div>Загрузка...</div>;
  const editFullChecklist = () => {
    setChecklistSetupOpen(true);
  };
  
  const deleteAllChecklists = async () => {
    const confirmDelete = confirm("Удалить ВСЕ чек-листы (включая для поездки)?");
    if (!confirmDelete) return;
  
    const { error } = await supabase
      .from("checklists")
      .delete()
      .eq("user_id", user.id);
  
    if (error) {
      alert("❌ Ошибка при удалении: " + error.message);
      return;
    }
  
    setMorningChecklist({});
    setEveningChecklist({});
    alert("✅ Все чек-листы удалены.");
  };
  
  const getRussianDayName = (day) => {
    const mapping = {
      monday: "Понедельник",
      tuesday: "Вторник",
      wednesday: "Среда",
      thursday: "Четверг",
      friday: "Пятница",
      saturday: "Суббота",
      sunday: "Воскресенье",
    };
  
    const todayIndex = new Date().getDay();
    const todayName = daysOfWeek[todayIndex === 0 ? 6 : todayIndex - 1];
  
    return day === todayName ? "Сегодня" : mapping[day] || day;
  };
  
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
<div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-4">
    <h2 className="text-xl font-semibold text-gray-900">🧾 Чек-лист</h2>
    <Button
      variant="ghost"
      size="icon"
      onClick={() => changeDay(-1)}
      disabled={selectedDayIndex === 0}
    >
      ←
    </Button>
    <div className="text-sm font-medium text-gray-700 capitalize">
      {getRussianDayName(selectedDayName)}
    </div>
    <Button
      variant="ghost"
      size="icon"
      onClick={() => changeDay(1)}
      disabled={selectedDayIndex === 6}
    >
      →
    </Button>
    <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" title="Редактировать">
      ✏️
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem
      onClick={() => {
        const stepIndex = selectedDayIndex * 2; // Утро
        setChecklistWizardProps({
          initialStep: stepIndex,
          singleDayMode: true,
          isTrip: tripMode
        });
        setChecklistSetupOpen(true);
      }}
    >
      🌅 Редактировать утро
    </DropdownMenuItem>
    <DropdownMenuItem
      onClick={() => {
        const stepIndex = selectedDayIndex * 2 + 1; // Вечер
        setChecklistWizardProps({
          initialStep: stepIndex,
          singleDayMode: true,
          isTrip: tripMode
        });
        setChecklistSetupOpen(true);
      }}
    >
      🌙 Редактировать вечер
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

  </div>

  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
        <span className="text-xl">⋯</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => setChecklistSetupOpen(true)}>
        🛠 Создать чек-лист
      </DropdownMenuItem>
      <DropdownMenuItem onClick={editFullChecklist}>
        ✏️ Редактировать все
      </DropdownMenuItem>
      <DropdownMenuItem
        className="text-red-500"
        onClick={deleteAllChecklists}
      >
        ❌ Удалить все
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>



          <Card>
          <CardContent className="p-4 space-y-6">
  <div className="space-y-3">
    <h2 className="text-lg font-semibold text-gray-900">🧼 Утро</h2>
    {resolvedMorningSteps.map((product) => (
  <div key={`morning-${product.id}`} className="flex items-center space-x-3">
    <Checkbox
      id={`morning-${product.id}`}
      checked={!!morningChecklist[product.id]}
      onCheckedChange={() => toggleStep("morning", product.id)}
      disabled={morningCompleted}
    />
    <label htmlFor={`morning-${product.id}`} className="text-sm text-gray-800">
      {product.name}
    </label>
  </div>
))}

    <Button
  onClick={async () => {
    setMorningCompleted(true);

    await supabase.from("progress").upsert([
      {
        user_id: user.id,
        date: getDateFromWeekdayIndex(selectedDayIndex),
        morning_done: true,
        evening_done: eveningCompleted,
        done: true && eveningCompleted,
        morning_steps: morningChecklist,
        evening_steps: eveningChecklist,
        trip_mode: tripMode,
      },
    ], { onConflict: ["user_id", "date"] });
  }}
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
    {resolvedEveningSteps.map((product) => (
  <div key={`evening-${product.id}`} className="flex items-center space-x-3">
    <Checkbox
      id={`evening-${product.id}`}
      checked={!!eveningChecklist[product.id]}
      onCheckedChange={() => toggleStep("evening", product.id)}
      disabled={eveningCompleted}
    />
    <label htmlFor={`evening-${product.id}`} className="text-sm text-gray-800">
      {product.name}
    </label>
  </div>
))}

    <Button
  onClick={async () => {
    setEveningCompleted(true);

    await supabase.from("progress").upsert([
      {
        user_id: user.id,
        date: getDateFromWeekdayIndex(selectedDayIndex),
        morning_done: morningCompleted,
        evening_done: true,
        done: morningCompleted && true,
        morning_steps: morningChecklist,
        evening_steps: eveningChecklist,
        trip_mode: tripMode,
      },
    ], { onConflict: ["user_id", "date"] });
  }}
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
  <Dialog open={checklistSetupOpen} onOpenChange={setChecklistSetupOpen}>
  <DialogContent className="max-w-lg rounded-2xl">
    <DialogTitle className="text-xl font-semibold text-gray-900">Настройка чек-листа</DialogTitle>
    <ChecklistWizard
  user={user}
  initialStep={checklistWizardProps.initialStep}
  singleDayMode={checklistWizardProps.singleDayMode}
  isTrip={checklistWizardProps.isTrip}
  onComplete={async () => {
    setChecklistSetupOpen(false);
    await fetchChecklist(daysOfWeek[Math.floor(checklistWizardProps.initialStep / 2)]);
  }}
/>


  </DialogContent>
</Dialog>
</div>
    );
};
