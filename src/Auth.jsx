import { useState } from "react";
import { supabase } from "./supabaseClient";
import { Button } from "@/components/ui/button";

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleLogin = async () => {
    setErrorMsg("");
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("Ошибка: " + error.message);
    } else {
      onLogin(data.session);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      setErrorMsg("Введите email для сброса");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);

    if (error) {
      setErrorMsg("Ошибка: " + error.message);
    } else {
      alert("Ссылка для сброса пароля отправлена на почту");
      setShowReset(false);
      setResetEmail("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-sm space-y-6">
        <h2 className="text-2xl font-semibold text-center text-gray-900">Вход</h2>

        {errorMsg && (
          <div className="text-red-600 text-sm text-center">{errorMsg}</div>
        )}

        {!showReset ? (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <Button
              className="w-full rounded-xl bg-black text-white hover:bg-gray-800"
              onClick={handleLogin}
            >
              Войти
            </Button>
            <button
              className="w-full text-sm text-blue-600 hover:underline text-center"
              onClick={() => setShowReset(true)}
            >
              Забыли пароль?
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-700 text-center">
              Введите email для сброса пароля:
            </p>
            <input
              type="email"
              placeholder="Ваш email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <Button
              className="w-full rounded-xl bg-black text-white hover:bg-gray-800"
              onClick={handlePasswordReset}
            >
              Отправить ссылку
            </Button>
            <button
              className="w-full text-sm text-gray-600 hover:underline text-center"
              onClick={() => {
                setShowReset(false);
                setErrorMsg("");
              }}
            >
              Назад к входу
            </button>
          </>
        )}
      </div>
    </div>
  );
}
