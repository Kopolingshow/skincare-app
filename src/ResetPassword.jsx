import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { Button } from "@/components/ui/button";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [validReset, setValidReset] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const access_token = hash.match(/access_token=([^&]+)/)?.[1];
    const refresh_token = hash.match(/refresh_token=([^&]+)/)?.[1];
    const type = hash.match(/type=([^&]+)/)?.[1];

    // Проверяем, что это именно сброс пароля
    if (type === "recovery" && access_token && refresh_token) {
      setValidReset(true);
      supabase.auth.setSession({
        access_token,
        refresh_token,
      });
    }
  }, []);

  const handleChange = async () => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setConfirmed(true);
    }
  };

  if (!validReset) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-red-600 text-center text-lg">
          Ссылка для сброса недействительна или устарела.
        </p>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-green-600 text-center text-lg">
          ✅ Пароль успешно изменён. Теперь вы можете войти.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4 text-center">Сброс пароля</h2>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <input
          type="password"
          placeholder="Новый пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
        />
        <Button className="w-full" onClick={handleChange}>
          Сменить пароль
        </Button>
      </div>
    </div>
  );
}
