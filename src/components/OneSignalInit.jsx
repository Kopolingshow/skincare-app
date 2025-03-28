// src/components/OneSignalInit.jsx
import { useEffect } from "react";

export default function OneSignalInit() {
  useEffect(() => {
    // создаем глобальную очередь для OneSignal v16
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    // Добавляем скрипт SDK
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    document.head.appendChild(script);

    // Инициализация + экспорт функции показа запроса
    window.OneSignalDeferred.push(async function (OneSignal) {
      await OneSignal.init({
        appId: "960fc10e-9c16-4247-b8b3-908f82b3b61b",
      });

      // глобальная функция для вызова разрешения
      window.askOneSignalPermission = () => {
        OneSignal.showSlidedownPrompt();
      };
    });

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
}
