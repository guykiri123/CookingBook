// Read an image File and return a downscaled JPEG data URL.
// Downscaling keeps the base64 string small enough for localStorage
// (a full-resolution phone photo can blow past the ~5MB quota on its own).
export function fileToScaledDataUrl(file, maxSize = 1000, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('הקובץ שנבחר אינו תמונה'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('קריאת הקובץ נכשלה'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('טעינת התמונה נכשלה'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Read an image File into a raw (un-scaled) data URL. Used as the source for
// the crop editor so the user crops from full resolution; getCroppedDataUrl
// then downscales the chosen region.
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('הקובץ שנבחר אינו תמונה'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('קריאת הקובץ נכשלה'));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

// Crop a region out of an image (data URL) and return a downscaled JPEG data
// URL. `area` is the pixel rectangle reported by react-easy-crop's
// onCropComplete ({ x, y, width, height } in natural pixels).
export function getCroppedDataUrl(imageSrc, area, maxSize = 1000, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Harmless for data URLs; lets remote (Unsplash) images draw without taint.
    img.crossOrigin = 'anonymous';
    img.onerror = () => reject(new Error('טעינת התמונה נכשלה'));
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(area.width, area.height));
      const w = Math.max(1, Math.round(area.width * scale));
      const h = Math.max(1, Math.round(area.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, w, h);

      try {
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        reject(new Error('עיבוד התמונה נכשל'));
      }
    };
    img.src = imageSrc;
  });
}
