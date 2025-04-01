// Вкладка "Мои средства" с загрузкой из Supabase и формой добавления, редактирования и удаления
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";



const INGREDIENT_INFO = {
  "ретинол": "Стимулирует обновление клеток кожи",
  "цинк": "Снижает воспаление и жирность кожи",
  "салициловая кислота": "Очищает поры, отшелушивает",
  "ниацинамид": "Улучшает барьер кожи, осветляет пятна",
  "гиалуроновая кислота": "Интенсивно увлажняет кожу",
  "азелаиновая кислота": "Снижает воспаления и выравнивает тон кожи",
  "витамин с": "Антиоксидант, осветляет пигментацию",
  "пептиды": "Укрепляют кожу и стимулируют выработку коллагена",
  "коэнзим q10": "Борется со старением и свободными радикалами",
  "арбутин": "Осветляет пигментацию и предотвращает её появление",
  "церамиды": "Восстанавливают защитный барьер кожи"
};

export default function MyProductsTab({ user }) {
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [showAddedMessage, setShowAddedMessage] = useState(false);
  const [showDeletedMessage, setShowDeletedMessage] = useState(false);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    time_of_use: "",
    category: "",
    ingredients: ""
  });

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setProducts(data);
  };

  useEffect(() => {
    if (!user) return;
    fetchProducts();
  }, [user]);

  const openProduct = (product) => {
    setSelected(product);
    setOpen(true);
  };

  const handleAdd = async () => {
    const { name, description, time_of_use, category, ingredients } = newProduct;
    const parsedIngredients = ingredients.split(",").map(i => i.trim());
  
    const { error } = await supabase.from("products").insert({
      user_id: user.id,
      name,
      description,
      time_of_use,
      category,
      ingredients: parsedIngredients,
      in_routine: true
    });
  
    if (!error) {
      setAddOpen(false); // Закрываем окно
      setNewProduct({ // Сбрасываем поля
        name: "",
        description: "",
        time_of_use: "",
        category: "",
        ingredients: ""
      });
      setSelected(null);
      fetchProducts();
      setShowAddedMessage(true);
      setTimeout(() => setShowAddedMessage(false), 2000);
    }
  };
  

  const handleEdit = async () => {
    const { id } = selected;
    const { name, description, time_of_use, category, ingredients } = newProduct;
    const parsedIngredients = ingredients.split(",").map(i => i.trim());
    const { error } = await supabase.from("products").update({
      name,
      description,
      time_of_use,
      category,
      ingredients: parsedIngredients
    }).eq("id", id);
    if (!error) {
      setEditOpen(false);
      setSelected(null);
      fetchProducts();
  
      // Показываем уведомление
      setShowSavedMessage(true);
      setTimeout(() => setShowSavedMessage(false), 2000);
    }
  };
  

  const handleDelete = async () => {
    const { id } = selected;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      setConfirmDelete(false);
      setOpen(false);
      setSelected(null);
      fetchProducts();
      setShowDeletedMessage(true);
      setTimeout(() => setShowDeletedMessage(false), 2000);
    }
  };
  

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Мои средства</h2>
        <Button variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Добавить
        </Button>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">Нет добавленных средств</p>
      ) : (
        <div className="grid gap-4">
  {products.map((product) => (
    <Card
      key={product.id}
      className="bg-white rounded-2xl shadow-md overflow-hidden transition-transform hover:scale-[1.01]"
    >
      <CardContent
        className="p-4 cursor-pointer"
        onClick={(e) => {
          if (e.target.closest("button")) return;
          openProduct(product);
        }}
      >
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="font-semibold text-base text-gray-900">{product.name}</p>
            <p className="text-xs text-gray-500">
              {product.category} • {product.time_of_use}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="hover:bg-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(product);
setNewProduct({
  ...product,
  ingredients: Array.isArray(product.ingredients)
    ? product.ingredients.join(", ")
    : product.ingredients,
});
setEditOpen(true);
                }}
              >
                Изменить
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(product);
                  setConfirmDelete(true);
                }}
              >
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  ))}
</div>

      )}

      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md rounded-2xl shadow-lg">
  {selected && (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-2xl font-semibold text-gray-900">{selected.name}</h3>
        <p className="text-sm text-gray-600">{selected.description}</p>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">💡 Активные компоненты</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
          {selected.ingredients.map((item, i) => (
            <li key={i}>
              <strong>{item}:</strong>{" "}
              {INGREDIENT_INFO[item.toLowerCase()] || "Нет описания"}
            </li>
          ))}
        </ul>
      </div>

      <Button
        className="w-full py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition-all"
        onClick={() =>
          window.open(
            `https://www.ozon.ru/search/?text=${encodeURIComponent(selected.name)}`,
            "_blank"
          )
        }
      >
        Заказать на Ozon
      </Button>
    </div>
  )}
</DialogContent>

      </Dialog>

      {/* Добавление */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
      <DialogContent className="max-w-md rounded-2xl">
  <DialogTitle className="text-xl font-semibold text-gray-900">Добавить средство</DialogTitle>
  <div className="space-y-4 pt-2">
    <div className="space-y-1">
      <Label className="text-sm text-gray-700">Название</Label>
      <Input
        className="rounded-xl"
        value={newProduct.name}
        onChange={(e) => setNewProduct(p => ({ ...p, name: e.target.value }))}
      />
    </div>
    <div className="space-y-1">
      <Label className="text-sm text-gray-700">Описание</Label>
      <Input
        className="rounded-xl"
        value={newProduct.description}
        onChange={(e) => setNewProduct(p => ({ ...p, description: e.target.value }))}
      />
    </div>
    <div className="space-y-1">
      <Label className="text-sm text-gray-700">Категория</Label>
      <Input
        className="rounded-xl"
        value={newProduct.category}
        onChange={(e) => setNewProduct(p => ({ ...p, category: e.target.value }))}
      />
    </div>
    <div className="space-y-1">
      <Label className="text-sm text-gray-700">Время использования</Label>
      <Input
        className="rounded-xl"
        placeholder="утро / вечер / оба"
        value={newProduct.time_of_use}
        onChange={(e) => setNewProduct(p => ({ ...p, time_of_use: e.target.value }))}
      />
    </div>
    <div className="space-y-1">
      <Label className="text-sm text-gray-700">Компоненты (через запятую)</Label>
      <Input
        className="rounded-xl"
        value={newProduct.ingredients}
        onChange={(e) => setNewProduct(p => ({ ...p, ingredients: e.target.value }))}
      />
    </div>
    <Button
      onClick={handleAdd}
      className="w-full py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-all"
    >
      Добавить
    </Button>
  </div>
</DialogContent>

      </Dialog>

      {/* Редактирование */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
  <DialogContent className="max-w-md rounded-2xl">
    <DialogTitle className="text-xl font-semibold text-gray-900">Редактировать средство</DialogTitle>
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <Label className="text-sm text-gray-700">Название</Label>
        <Input
          className="rounded-xl"
          value={newProduct.name}
          onChange={(e) =>
            setNewProduct((p) => ({ ...p, name: e.target.value }))
          }
        />
        
      </div>
      <div className="space-y-1">
        <Label className="text-sm text-gray-700">Описание</Label>
        <Input
          className="rounded-xl"
          value={newProduct.description}
          onChange={(e) =>
            setNewProduct((p) => ({ ...p, description: e.target.value }))
          }
        />
      </div>
      <div className="space-y-1">
        <Label className="text-sm text-gray-700">Категория</Label>
        <Input
          className="rounded-xl"
          value={newProduct.category}
          onChange={(e) =>
            setNewProduct((p) => ({ ...p, category: e.target.value }))
          }
        />
      </div>
      <div className="space-y-1">
        <Label className="text-sm text-gray-700">Время использования</Label>
        <Input
          className="rounded-xl"
          placeholder="утро / вечер / оба"
          value={newProduct.time_of_use}
          onChange={(e) =>
            setNewProduct((p) => ({ ...p, time_of_use: e.target.value }))
          }
        />
      </div>
      <div className="space-y-1">
        <Label className="text-sm text-gray-700">Компоненты (через запятую)</Label>
        <Input
          className="rounded-xl"
          value={newProduct.ingredients}
          onChange={(e) =>
            setNewProduct((p) => ({ ...p, ingredients: e.target.value }))
          }
        />
      </div>
      <Button
        onClick={handleEdit}
        className="w-full py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-all"
      >
        Сохранить
      </Button>
    </div>
  </DialogContent>
</Dialog>


      {/* Подтверждение удаления */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogTitle>Удалить средство?</DialogTitle>
          <DialogDescription>
            Это действие нельзя будет отменить. Вы уверены, что хотите удалить <strong>{selected?.name}</strong>?
          </DialogDescription>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Отмена</Button>
            <Button variant="destructive" onClick={handleDelete}>Удалить</Button>
          </div>
        </DialogContent>
      </Dialog>
      {showSavedMessage && (
  <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-800 px-4 py-2 rounded-xl shadow-md text-sm font-medium flex items-center gap-2 z-50">
    ✅ Изменения сохранены
  </div>
)}

{showAddedMessage && (
  <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-100 text-blue-800 px-4 py-2 rounded-xl shadow-md text-sm font-medium flex items-center gap-2 z-50">
    ➕ Средство добавлено
  </div>
)}

{showDeletedMessage && (
  <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-800 px-4 py-2 rounded-xl shadow-md text-sm font-medium flex items-center gap-2 z-50">
    🗑 Средство удалено
  </div>
)}
    </div>
  );
}
