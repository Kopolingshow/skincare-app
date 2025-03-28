import React, { useState, useRef, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
  } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AvatarEditor from "./AvatarEditor";

export default function AvatarUploader({ user, displayName, refreshProfile }) {
  const [avatarUrl, setAvatarUrl] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [imageToEdit, setImageToEdit] = useState(null);
  const inputRef = useRef();

  
    useEffect(() => {
        const fetchAvatar = async () => {
          const { data, error } = await supabase
            .from("users")
            .select("avatar_url")
            .eq("id", user.id)
            .single();
          if (!error && data?.avatar_url) {
            setAvatarUrl(`${data.avatar_url}?t=${Date.now()}`);
          }
        };
      
        if (user) fetchAvatar();
      }, [user]);

      const loadAvatarUrl = async () => {
        const { data, error } = await supabase
          .from("users")
          .select("avatar_url")
          .eq("id", user.id)
          .single();
        if (!error && data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      };
  const handleUpload = async (file) => {
    if (!file || !user) return;
    const filePath = `${user.id}/avatar.png`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Ошибка загрузки:", uploadError.message);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    const { error: updateError } = await supabase
      .from("users")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (updateError) {
      console.error("Ошибка обновления профиля:", updateError.message);
      return;
    }

    setAvatarUrl(publicUrl);
    refreshProfile?.();
  };

  return (
    <div className="flex items-center gap-4">
      <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <img
      src={avatarUrl || "/placeholder-avatar.png"}
      alt="avatar"
      className="w-20 h-20 rounded-full object-cover cursor-pointer border"
    />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => inputRef.current?.click()}>
      Заменить фото
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => inputRef.current?.click()}>
      Отредактировать
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>


      <div>
        <p className="font-medium text-lg">Привет, {displayName || "друг"}!</p>
        <p className="text-sm text-muted-foreground">Твоя кожа будет идеальной</p>
      </div>

      <input
  type="file"
  accept="image/*"
  ref={inputRef}
  onChange={(e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageToEdit(reader.result);  // Кладём картинку в редактор
      setEditorOpen(true);            // Открываем редактор
    };
    reader.readAsDataURL(selected);
  }}
  className="hidden"
/>


<Dialog open={editorOpen} onOpenChange={setEditorOpen}>
  <DialogContent className="max-w-3xl">
    <AvatarEditor
      user={user}
      imageSrc={imageToEdit} // <-- передаём фото!
      onClose={() => setEditorOpen(false)}
     onSave={async (croppedFile) => {
  await handleUpload(croppedFile);      // ⏳ дождёмся загрузки
  await loadAvatarUrl();                // ⬅️ подтянем актуальный avatar_url
  refreshProfile?.();                   // 🔄 если нужно обновить имя
}}
    />
  </DialogContent>
</Dialog>

    </div>
  );
}
