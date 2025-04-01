import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import SkincareApp from "./SkincareApp";
import Auth from "./Auth";
import { supabase } from "./supabaseClient";
import "./index.css";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  const url = new URL(window.location.href);
  const access_token = url.hash.match(/access_token=([^&]+)/)?.[1];
  const refresh_token = url.hash.match(/refresh_token=([^&]+)/)?.[1];

  useEffect(() => {
    if (access_token && refresh_token) {
      supabase.auth.setSession({
        access_token,
        refresh_token,
      });
    }
  }, [access_token, refresh_token]);

  const handleChange = async () => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setConfirmed(true);
    }
  };

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-green-600 text-center text-lg">
          ✅ Пароль успешно изменён! Теперь вы можете войти.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
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
        <button
          onClick={handleChange}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
        >
          Сменить пароль
        </button>
      </div>
    </div>
  );
}

function AppWrapper() {
  const [session, setSession] = useState(null);
  const [isReset, setIsReset] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const type = hash.match(/type=([^&]+)/)?.[1];

    if (type === "recovery") {
      setIsReset(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (isReset) return <ResetPassword />;
  return session ? <SkincareApp session={session} /> : <Auth onLogin={setSession} />;
}


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
