import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { Button } from "@/components/ui/button";
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { 
  SortableContext, 
  verticalListSortingStrategy, 
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Компонент для перетаскиваемых элементов
const SortableItem = ({ id, children, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="relative group flex items-center gap-2 p-3 bg-white rounded-lg shadow-sm border mb-2"
    >
      <button
        {...listeners}
        className="touch-none md:touch-auto"
        aria-label="Перетащить"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-400 hover:text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      
      <div className="flex-1">{children}</div>
      
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
      >
        ×
      </button>
    </div>
  );
};

const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function ChecklistWizard({ user, onComplete, initialStep = 0, singleDayMode = false, isTrip = false }) {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [orderedProducts, setOrderedProducts] = useState({});
  const [currentOrder, setCurrentOrder] = useState([]);
  const [isTripChecklist, setIsTripChecklist] = useState(isTrip);
  const [step, setStep] = useState(initialStep);
  const [loaded, setLoaded] = useState(false);

  const currentDay = daysOfWeek[Math.floor(step / 2)];
  const currentType = step % 2 === 0 ? "morning" : "evening";
  const key = `${currentDay}_${currentType}_${isTripChecklist}`;

  // Настройка сенсоров для мыши и тач-устройств
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // 1. Загружаем продукты
      const { data: productsData } = await supabase
        .from("products")
        .select("id, name")
        .eq("user_id", user.id);
      setProducts(productsData || []);

      // 2. Загружаем чек-листы
      const { data: checklistData } = await supabase
        .from("checklists")
        .select("day, type, product_ids, order, is_trip")
        .eq("user_id", user.id);

      // 3. Инициализируем состояние
      const initialSelected = {};
      const initialOrdered = {};

      checklistData?.forEach((item) => {
        const itemKey = `${item.day}_${item.type}_${item.is_trip}`;
        initialSelected[itemKey] = item.product_ids || [];
        initialOrdered[itemKey] = item.order || item.product_ids || [];
      });

      setSelectedProducts(initialSelected);
      setOrderedProducts(initialOrdered);
      setCurrentOrder(initialOrdered[key] || []);
      setLoaded(true);
    };

    fetchData();
  }, [user, key]);

  // Переключение продукта
  const toggleProduct = (id) => {
    const currentSelected = selectedProducts[key] || [];
    const currentOrdered = orderedProducts[key] || [];

    let newSelected, newOrder;

    if (currentSelected.includes(id)) {
      newSelected = currentSelected.filter((pid) => pid !== id);
      newOrder = currentOrdered.filter((pid) => pid !== id);
    } else {
      newSelected = [...currentSelected, id];
      newOrder = [...currentOrdered, id];
    }

    setSelectedProducts((prev) => ({ ...prev, [key]: newSelected }));
    setOrderedProducts((prev) => ({ ...prev, [key]: newOrder }));
    setCurrentOrder(newOrder);
  };

  // Обработка перетаскивания
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    
    setCurrentOrder((items) => {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  // Сохранение порядка
  useEffect(() => {
    const timeout = setTimeout(() => {
      setOrderedProducts(prev => ({
        ...prev,
        [key]: currentOrder,
      }));
    }, 100);

    return () => clearTimeout(timeout);
  }, [currentOrder]);

  // Сохранение шага
  const saveStep = async (exitAfterSave) => {
    const productIds = selectedProducts[key] || [];
    const productOrder = currentOrder.filter(id => productIds.includes(id));

    const { error } = await supabase.from("checklists").upsert(
      {
        user_id: user.id,
        day: currentDay,
        type: currentType,
        product_ids: productIds,
        order: productOrder,
        is_trip: isTripChecklist,
      },
      { onConflict: ["user_id", "day", "type", "is_trip"] }
    );

    if (!error && exitAfterSave) {
      onComplete();
    } else if (!error) {
      setStep(step + 1);
    }
  };

  if (!loaded) return <p className="p-4 text-center">Загрузка...</p>;

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-xl font-semibold text-center capitalize">
        {isTripChecklist ? "✈️ Поездка: " : ""}
        {currentDay === "sunday" ? "Воскресенье" : 
         currentDay === "saturday" ? "Суббота" : 
         currentDay.charAt(0).toUpperCase() + currentDay.slice(1)}, 
        {currentType === "morning" ? " утро" : " вечер"}
      </h2>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={currentOrder} 
          strategy={verticalListSortingStrategy}
        >
          <div className="mb-4">
            {currentOrder.map((id) => {
              const product = products.find(p => p.id === id);
              if (!product) return null;
              
              return (
                <SortableItem 
                  key={product.id} 
                  id={product.id}
                  onRemove={() => toggleProduct(product.id)}
                >
                  <span className="text-gray-800">{product.name}</span>
                </SortableItem>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <div className="space-y-2">
        <h3 className="font-medium text-gray-700">Доступные средства:</h3>
        {products
          .filter(p => !currentOrder.includes(p.id))
          .map(p => (
            <div
              key={p.id}
              className="p-3 bg-gray-50 rounded-lg border flex items-center gap-3 hover:bg-gray-100 transition-colors"
            >
              <button
                onClick={() => toggleProduct(p.id)}
                className="w-6 h-6 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800"
              >
                +
              </button>
              <span className="text-gray-700">{p.name}</span>
            </div>
          ))}
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          onClick={() => saveStep(true)}
          variant="outline"
          className="flex-1"
        >
          Сохранить и выйти
        </Button>
        {!singleDayMode && (
          <Button
            onClick={() => saveStep(false)}
            className="flex-1 bg-black hover:bg-gray-800"
          >
            Далее →
          </Button>
        )}
      </div>
    </div>
  );
}