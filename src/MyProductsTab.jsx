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
      setAddOpen(false);
      setNewProduct({ name: "", description: "", time_of_use: "", category: "", ingredients: "" });
      fetchProducts();
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
            <Card key={product.id} className="relative">
            <CardContent
              className="p-4 cursor-pointer"
              onClick={(e) => {
                if (e.target.closest("button")) return; // предотвращаем открытие по кнопке
                openProduct(product);
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-base mb-1">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.category} • {product.time_of_use}
                  </p>
                </div>
          
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => e.stopPropagation()} // обязательно!
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setNewProduct(product);
                      setEditOpen(true);
                    }}>
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

      {/* Просмотр */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {selected && (
            <div className="space-y-3">
              <DialogTitle>{selected.name}</DialogTitle>
              <DialogDescription>{selected.description}</DialogDescription>
              <div>
                <p className="font-semibold text-sm mb-1">Активные компоненты:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {selected.ingredients.map((item, i) => (
                    <li key={i}>
                      <strong>{item}:</strong> {INGREDIENT_INFO[item.toLowerCase()] || "Нет описания"}
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                variant="outline"
                onClick={() => window.open(`https://www.ozon.ru/search/?text=${encodeURIComponent(selected.name)}`, "_blank")}
              >
                Заказать на Ozon
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Добавление */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogTitle>Добавить средство</DialogTitle>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Название</Label>
              <Input value={newProduct.name} onChange={(e) => setNewProduct(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Описание</Label>
              <Input value={newProduct.description} onChange={(e) => setNewProduct(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Категория</Label>
              <Input value={newProduct.category} onChange={(e) => setNewProduct(p => ({ ...p, category: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Время использования</Label>
              <Input value={newProduct.time_of_use} onChange={(e) => setNewProduct(p => ({ ...p, time_of_use: e.target.value }))} placeholder="утро / вечер / оба" />
            </div>
            <div className="space-y-1">
              <Label>Компоненты (через запятую)</Label>
              <Input value={newProduct.ingredients} onChange={(e) => setNewProduct(p => ({ ...p, ingredients: e.target.value }))} />
            </div>
            <Button onClick={handleAdd}>Добавить</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Редактирование */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogTitle>Редактировать средство</DialogTitle>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Название</Label>
              <Input value={newProduct.name} onChange={(e) => setNewProduct(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Описание</Label>
              <Input value={newProduct.description} onChange={(e) => setNewProduct(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Категория</Label>
              <Input value={newProduct.category} onChange={(e) => setNewProduct(p => ({ ...p, category: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Время использования</Label>
              <Input value={newProduct.time_of_use} onChange={(e) => setNewProduct(p => ({ ...p, time_of_use: e.target.value }))} placeholder="утро / вечер / оба" />
            </div>
            <div className="space-y-1">
              <Label>Компоненты (через запятую)</Label>
              <Input value={newProduct.ingredients} onChange={(e) => setNewProduct(p => ({ ...p, ingredients: e.target.value }))} />
            </div>
            <Button onClick={handleEdit}>Сохранить</Button>
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
    </div>
  );
}
