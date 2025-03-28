import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EditProfileDialog({ user, refreshProfile, open, onOpenChange }) {
  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", user.id)
        .single();
      if (!error && data) {
        setDisplayName(data.display_name || "");
      }
    };
    if (user && open) fetchProfile();
  }, [user, open]);

  const handleSave = async () => {
    if (!/^[A-Za-zА-Яа-яЁё\s]{1,30}$/.test(displayName)) {
      alert("Имя должно содержать только буквы и быть до 30 символов");
      return;
    }

    const updates = { display_name: displayName };

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id);

    if (newPassword) {
      const { error: pwError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (pwError) {
        alert("Ошибка смены пароля: " + pwError.message);
        return;
      }
    }

    if (error) {
      alert("Ошибка сохранения профиля: " + error.message);
    } else {
      refreshProfile();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>Редактирование профиля</DialogTitle>
        <DialogDescription>Введите имя и новый пароль</DialogDescription>

        <div className="flex flex-col gap-4 mt-4">
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ваше имя"
            className="w-full"
          />
          <Input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            type="password"
            placeholder="Новый пароль"
            className="w-full"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => {
              setNewPassword("");
              onOpenChange(false);
            }}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
