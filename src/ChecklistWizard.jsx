import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/supabaseClient";
import { DndContext } from "@dnd-kit/core";
import { useSortable, SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";



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
  const [orderedProducts, setOrderedProducts] = useState({});
  const [currentOrder, setCurrentOrder] = useState([]);
  const [isTripChecklist, setIsTripChecklist] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const currentDay = daysOfWeek[Math.floor(step / 2)];
  const currentType = step % 2 === 0 ? "morning" : "evening";
  const [isSingleDayMode, setIsSingleDayMode] = useState(false);
  const getDateFromWeekday = (weekday) => {
    const daysOfWeek = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
    const index = daysOfWeek.indexOf(weekday);
    const today = new Date();
    const currentDay = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const diff = index - currentDay;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    return targetDate.toISOString().split("T")[0];
  };
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
  
      const { data: productsData } = await supabase
  .from("products")
  .select("id, name")
  .eq("user_id", user.id);
  setProducts(productsData);
  
      const { data: checklistData } = await supabase
        .from("checklists")
        .select("day, type, product_ids, is_trip")
        .eq("user_id", user.id);
  
      if (checklistData && (Object.keys(selectedProducts).length === 0 || singleDayMode)) {
        const initialSelected = {};
        checklistData.forEach((item) => {
          const key = `${item.day}_${item.type}_${item.is_trip}`;
          initialSelected[key] = item.product_ids;
        });
        setSelectedProducts(initialSelected);
      }
      const initialOrdered = {};
checklistData.forEach((item) => {
  const key = `${item.day}_${item.type}_${item.is_trip}`;
  const order = item.order || item.product_ids;
  initialOrdered[key] = order;

  if (key === `${currentDay}_${currentType}_${isTrip}`) {
    setCurrentOrder(order);
  }
});
setOrderedProducts(initialOrdered);
  
      if (singleDayMode) {
        setStep(initialStep);
        setIsTripChecklist(isTrip);
        setIsSingleDayMode(true); // 🟢 сохраняем для дальнейшего использования
        setLoaded(true);
        return;
      }
  
      setLoaded(true);
    };
  
    fetchData();
  }, [user, singleDayMode, initialStep, isTrip]);
  
  

  const toggleProduct = (id) => {
    const key = `${currentDay}_${currentType}_${isTripChecklist}`;
    const existingSelected = selectedProducts[key] || [];
    const existingOrder = orderedProducts[key] || [];
  
    let updatedSelected;
    let updatedOrder;
  
    if (existingSelected.includes(id)) {
      // Удаляем продукт
      updatedSelected = existingSelected.filter(pid => pid !== id);
      updatedOrder = existingOrder.filter(pid => pid !== id);
    } else {
      // Добавляем продукт
      updatedSelected = [...existingSelected, id];
      updatedOrder = [...existingOrder, id]; // Всегда добавляем в конец списка
    }
  
    setSelectedProducts(prev => ({ ...prev, [key]: updatedSelected }));
    setOrderedProducts(prev => ({ ...prev, [key]: updatedOrder }));
    setCurrentOrder(updatedOrder);

  };
  
  

  const saveStep = async (exitAfterSave) => {
    const key = `${currentDay}_${currentType}_${isTripChecklist}`;
    const productIds = selectedProducts[key] || [];
const productOrder = (orderedProducts[key] || []).filter(id => productIds.includes(id));

  
    const { error } = await supabase.from("checklists").upsert([
      {
        user_id: user.id,
        day: currentDay,
        type: currentType,
        product_ids: productIds,
        order: productOrder,
        is_trip: isTripChecklist,
      }
    ], { onConflict: ["user_id", "day", "type", "is_trip"] });
  
    if (error) {
      console.error("❌ Ошибка при upsert checklists:", error.message);
      return;
    }
  
    const progressDate = getDateFromWeekday(currentDay);
    const progressColumn = currentType === "morning" ? "morning_steps" : "evening_steps";
  
    const { error: progressError } = await supabase.from("progress").upsert({
      user_id: user.id,
      date: progressDate,
      [progressColumn]: productIds.reduce((acc, id) => ({ ...acc, [id]: false }), {}),
      trip_mode: isTripChecklist,
    }, { onConflict: ["user_id", "date"] });
  
    if (progressError) {
      console.error("❌ Ошибка при upsert progress:", progressError.message);
    }
  
    if (exitAfterSave || isSingleDayMode || (step === 13 && isTripChecklist)) {
      onComplete();
    } else if (step === 13 && !isTripChecklist) {
      const confirmTrip = confirm("Создать чек-лист для поездки?");
      if (confirmTrip) {
        setStep(0);
        setIsTripChecklist(true);
        return;
      } else {
        onComplete();
        return;
      }
    } else {
      setStep(s => s + 1);
    }
  };
  
  
  
  
  

  if (!loaded) return <p className="text-sm text-gray-500">Загрузка...</p>;

  const key = `${currentDay}_${currentType}_${isTripChecklist}`;
  const selected = selectedProducts[key] || [];
  


  function SortableProductItem({ product, checked, onToggle }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: product.id });
  
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
  
    return (
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        style={style}
        className="flex items-center gap-2 p-2 border rounded-md bg-white shadow-sm cursor-grab"
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(product.id)}
          className="mr-2"
        />
        <span className="flex-1">{product.name}</span>
        <span className="text-gray-400 text-sm">↕</span>
      </div>
    );
  }
  
  

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 capitalize">
        {isTripChecklist ? "[Поездка] " : ""}
        {currentDay}, {currentType === "morning" ? "утро" : "вечер"}
      </h2>
      <DndContext
  
    onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return;
      
        const key = `${currentDay}_${currentType}_${isTripChecklist}`;
        const oldIndex = currentOrder.indexOf(active.id);
        const newIndex = currentOrder.indexOf(over.id);
      
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
          setCurrentOrder(newOrder);
          setOrderedProducts(prev => ({ ...prev, [key]: newOrder }));
        }
      }}
>
<div className="flex flex-col gap-4">
  {/* Перетаскиваемые (выбранные) */}
  <SortableContext items={currentOrder} strategy={verticalListSortingStrategy}>
    <div className="flex flex-col gap-2">
      {currentOrder.map((id) => {
        const product = products.find((p) => p.id === id);
        if (!product) return null;

        return (
          <SortableProductItem
            key={product.id}
            product={product}
            checked={selected.includes(product.id)}
            onToggle={() => toggleProduct(product.id)}
          />
        );
      })}
    </div>
  </SortableContext>

  {/* Невыбранные — без drag */}
  <div className="flex flex-col gap-2 border-t pt-2 mt-2">
    {products
      .filter((p) => !selected.includes(p.id))
      .map((product) => (
        <div
          key={product.id}
          className="flex items-center gap-2 p-2 border rounded-md bg-gray-100 opacity-60"
        >
          <input
            type="checkbox"
            checked={false}
            onChange={() => toggleProduct(product.id)}
            className="mr-2"
          />
          <span className="flex-1 text-gray-500">{product.name}</span>
          <span className="text-gray-400 text-sm">—</span>
        </div>
      ))}
  </div>
</div>




</DndContext>


<div className="flex gap-2">
  <Button
    onClick={() => saveStep(true)}
    variant="outline"
    className="w-full rounded-xl"
  >
    Сохранить и выйти
  </Button>
  <Button
    onClick={() => saveStep(false)}
    className="w-full rounded-xl bg-black text-white hover:bg-gray-800"
  >
    Сохранить и далее
  </Button>
</div>

    </div>
  );
};

export default ChecklistWizard;
