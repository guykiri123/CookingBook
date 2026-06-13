import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { getCroppedDataUrl } from '../utils/image';

// Aspect ratio of the crop box. 16:9 matches the landscape image slots on the
// recipe cards and the recipe page hero, so what the user frames is what shows.
const ASPECT = 16 / 9;

// Modal crop editor. Receives the source image (data URL), lets the user pan +
// zoom inside a 16:9 frame, and returns a cropped, downscaled JPEG data URL via
// onConfirm. onCancel backs out without saving.
export default function ImageCropper({ src, onConfirm, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!areaPixels) return;
    setWorking(true);
    setError('');
    try {
      const dataUrl = await getCroppedDataUrl(src, areaPixels);
      onConfirm(dataUrl);
    } catch (err) {
      setError(err.message || 'עיבוד התמונה נכשל');
      setWorking(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="עריכת תמונת המתכון"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="p-5 border-b border-accent/20">
          <h2 className="font-display text-xl text-ink">מיקום וחיתוך התמונה</h2>
          <p className="text-sm text-ink-soft mt-1">
            גררו למיקום, והשתמשו בסליידר (או בצביטה במסך מגע) לזום. מה שבתוך המסגרת
            יוצג במתכון.
          </p>
        </div>

        <div className="relative w-full h-72 bg-ink/90">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={ASPECT}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid
          />
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-soft" aria-hidden="true">－</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-primary cursor-pointer"
              aria-label="מרחק תצוגה (זום)"
            />
            <span className="text-sm text-ink-soft" aria-hidden="true">＋</span>
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={working}
              className="px-5 py-2.5 rounded-full font-semibold border-2 border-accent/50 text-ink hover:bg-cream transition-colors disabled:opacity-50"
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={working || !areaPixels}
              className="bg-primary text-cream font-semibold px-6 py-2.5 rounded-full hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {working ? 'מעבד…' : 'אשר חיתוך'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
