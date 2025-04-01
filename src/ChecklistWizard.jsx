import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/supabaseClient";

const daysOfWeek = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const ChecklistWizard = ({
    user,
    onComplete,
    initialStep = 0,          // номер шага (например, понедельник-утро = 0)
    singleDayMode = false,     // true — если редактируем только один день
    isTrip = false             // true — если редактируем чек-лист для поездки
  }) => {
  const [products, setProducts] = useState([]);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (singleDayMode) {
      console.log("🛠 Режим редактирования одного дня:", initialStep);
      setStep(initialStep);
      setIsTripChecklist(isTrip);
    }
  }, [initialStep, singleDayMode, isTrip]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [isTripChecklist, setIsTripChecklist] = useState(false);
  const [loaded, setLoaded] = useState(false);
  

  const currentDay = daysOfWeek[Math.floor(step / 2)];
  const currentType = step % 2 === 0 ? "morning" : "evening";

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
  
      // Загружаем продукты
      const { data: productsData } = await supabase
        .from("products")
        .select("id, name")
        .eq("user_id", user.id);
  
      setProducts(productsData || []);
  
      // Загружаем чек-листы
      const { data: checklistData } = await supabase
        .from("checklists")
        .select("day, type, product_ids, is_trip")
        .eq("user_id", user.id);
  
      if (checklistData && Object.keys(selectedProducts).length === 0) {
        const initialSelected = {};
        checklistData.forEach((item) => {
          const key = `${item.day}_${item.type}_${item.is_trip}`;
          initialSelected[key] = item.product_ids;
        });
        setSelectedProducts(initialSelected);
      }
  
      if (singleDayMode) {
        console.log("🛠 Режим редактирования одного дня:", initialStep);
        setStep(initialStep);        // только initialStep
        setIsTripChecklist(isTrip);  // только режим поездки
      } else {
        // обычный режим — рассчитываем текущий шаг
        const normalSteps = checklistData.filter(c => !c.is_trip);
        const completedSteps = normalSteps.length;
        if (completedSteps >= 14) {
          const tripSteps = checklistData.filter(c => c.is_trip);
          if (tripSteps.length < 14) {
            setStep(0);
            setIsTripChecklist(true);
          } else {
            onComplete();
          }
        } else {
          setStep(completedSteps);
        }
      }
  
      setLoaded(true);
    };
  
    fetchData();
  }, [user, singleDayMode, initialStep, isTrip]);
  

  const toggleProduct = (id) => {
    const key = `${currentDay}_${currentType}_${isTripChecklist}`;
    const existing = selectedProducts[key] || [];
    const updated = existing.includes(id)
      ? existing.filter((pid) => pid !== id)
      : [...existing, id];
    setSelectedProducts((prev) => ({ ...prev, [key]: updated }));
  };

  const saveStep = async () => {
    const key = `${currentDay}_${currentType}_${isTripChecklist}`;
    const productIdsRaw = selectedProducts[key] || [];
  
    const productIds = productIdsRaw
      .filter((id) => id !== null && id !== undefined)
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));
  
    if (!user) return;
    const order = productIds.map((_, i) => i); // 0, 1, 2, ...

    console.log("🧪 Данные для upsert:", {
      user_id: user.id,
      day: currentDay,
      type: currentType,
      product_ids: productIds,
      order,
      is_trip: isTripChecklist,
    });
  
    const { error } = await supabase.from("checklists").upsert([
        {
          user_id: user.id,
          day: currentDay,
          type: currentType,
          product_ids: productIds,
          order,
          is_trip: isTripChecklist,
        }
      ]);
      
  
    if (error) {
      console.error("❌ Ошибка при upsert:", error.message);
    }
    if (singleDayMode) {
        onComplete(); // сразу закрываем мастер
        return;
      }
    if (step === 13 && !isTripChecklist) {
      const confirmTrip = confirm("Создать чек-лист для поездки?");
      if (confirmTrip) {
        setStep(0);
        setIsTripChecklist(true);
        return;
      } else {
        onComplete();
        return;
      }
    }
  
    if (step === 13 && isTripChecklist) {
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  };
  
  

  if (!loaded) return <p className="text-sm text-gray-500">Загрузка...</p>;

  const key = `${currentDay}_${currentType}_${isTripChecklist}`;
  const selected = selectedProducts[key] || [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 capitalize">
        {isTripChecklist ? "[Поездка] " : ""}
        {currentDay}, {currentType === "morning" ? "утро" : "вечер"}
      </h2>
      <div className="space-y-2">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center space-x-2 border rounded-xl px-4 py-2"
          >
            <Checkbox
              id={`product-${product.id}`}
              checked={selected.includes(product.id)}
              onCheckedChange={() => toggleProduct(product.id)}
            />
            <label htmlFor={`product-${product.id}`} className="text-sm">
              {product.name}
            </label>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => onComplete()}
          variant="outline"
          className="w-full rounded-xl"
        >
          Сохранить и выйти
        </Button>
        <Button
          onClick={saveStep}
          className="w-full rounded-xl bg-black text-white hover:bg-gray-800"
        >
          Сохранить и далее
        </Button>
      </div>
    </div>
  );
};

export default ChecklistWizard;
