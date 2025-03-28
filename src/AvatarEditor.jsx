import { useState } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "./utils/cropImage";

export default function AvatarEditor({ user, imageSrc, onClose, onSave }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);

  const onCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleCropSave = async () => {
    try {
      setUploading(true);

      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);

      if (!croppedImage) {
        console.error("Не удалось получить обрезанное изображение");
        return;
      }

      // ⏳ Ждём загрузку файла через родительский компонент
      await onSave(croppedImage);

      // ✅ Закрываем редактор после успешной загрузки
      onClose();
    } catch (error) {
      console.error("Ошибка загрузки аватарки:", error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {imageSrc && (
        <div className="relative w-[250px] h-[250px] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
      )}

      <button
        onClick={handleCropSave}
        disabled={uploading}
        className="px-4 py-2 bg-white text-black border rounded"
      >
        {uploading ? "Сохранение..." : "Сохранить аватар"}
      </button>
      <button
    onClick={onClose}
    disabled={uploading}
    className="px-4 py-2 bg-gray-200 text-black border rounded"
  >
    Отменить
  </button>
</div>
    
  );
}
