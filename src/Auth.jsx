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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-semibold mb-4 text-center">Вход</h2>

        {errorMsg && (
          <div className="text-red-600 text-sm mb-3 text-center">{errorMsg}</div>
        )}

        {!showReset ? (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-3 p-2 border rounded"
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-4 p-2 border rounded"
            />
            <Button className="w-full mb-2" onClick={handleLogin}>
              Войти
            </Button>
            <button
              className="text-sm text-blue-600 hover:underline w-full text-center"
              onClick={() => setShowReset(true)}
            >
              Забыли пароль?
            </button>
          </>
        ) : (
          <>
            <p className="text-sm mb-2 text-gray-700">Введите email для сброса пароля:</p>
            <input
              type="email"
              placeholder="Ваш email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full mb-3 p-2 border rounded"
            />
            <Button className="w-full mb-2" onClick={handlePasswordReset}>
              Отправить ссылку
            </Button>
            <button
              className="text-sm text-gray-600 hover:underline w-full text-center"
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
