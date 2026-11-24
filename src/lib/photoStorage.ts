const PHOTO_STORAGE_KEY = 'fittrack_ai_local_progress_photos_v1';

export interface StoredProgressPhoto {
  id: string;
  userId: string;
  dateKey: string;
  weightKg: number;
  caption: string;
  dataUrl: string;
}

export function loadLocalProgressPhotos(userId: string): StoredProgressPhoto[] {
  try {
    const raw = localStorage.getItem(PHOTO_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredProgressPhoto[];
    return Array.isArray(parsed) ? parsed.filter((item) => item.userId === userId) : [];
  } catch {
    return [];
  }
}

export function saveLocalProgressPhoto(photo: StoredProgressPhoto): void {
  try {
    const raw = localStorage.getItem(PHOTO_STORAGE_KEY);
    const all: StoredProgressPhoto[] = raw ? JSON.parse(raw) : [];
    const updated = [photo, ...all.filter((p) => p.id !== photo.id)].slice(0, 24);
    localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Unable to save local progress photo:', err);
  }
}

export function removeLocalProgressPhoto(photoId: string): void {
  try {
    const raw = localStorage.getItem(PHOTO_STORAGE_KEY);
    if (!raw) return;
    const all: StoredProgressPhoto[] = JSON.parse(raw);
    localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(all.filter((p) => p.id !== photoId)));
  } catch (err) {
    console.error('Unable to delete progress photo:', err);
  }
}

export function compressImageFileToDataUrl(file: File, maxWidth = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / Math.max(1, img.width));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas unavailable.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
