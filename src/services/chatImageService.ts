export interface ChatImageValidationResult {
  valid: boolean;
  error?: string;
}

export const ALLOWED_CHAT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_INPUT_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB input limit

export function validateChatImageFile(file: File): ChatImageValidationResult {
  if (!file) {
    return { valid: false, error: 'No image selected.' };
  }

  if (!ALLOWED_CHAT_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Please choose a JPEG, PNG, or WebP photo from your gallery or computer.'
    };
  }

  if (file.size > MAX_INPUT_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'The selected photo is too large (over 10 MB). Please choose a smaller photo.'
    };
  }

  return { valid: true };
}

export interface ProcessedChatImage {
  dataUrl: string;
  thumbnailUrl: string;
  sizeKb: number;
  width: number;
  height: number;
}

/**
 * Compresses an image file client-side into a secure, web-optimized Data URL (~60-140 KB)
 * and a lightweight thumbnail (~2-4 KB) for conversation previews.
 * Stored securely inside the private conversation message document, strictly restricted
 * to conversation participants via Firestore security rules.
 * Does not require external paid storage or Firebase Blaze billing plan.
 */
export async function processChatImage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<ProcessedChatImage> {
  const validation = validateChatImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  onProgress?.(15);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read image file from device.'));
    };

    reader.onload = (event) => {
      onProgress?.(40);
      const img = new Image();

      img.onerror = () => {
        reject(new Error('Failed to decode image. The file may be corrupted.'));
      };

      img.onload = () => {
        onProgress?.(65);

        try {
          // 1. Compute optimal full dimensions (max 1200px width/height)
          const MAX_DIMENSION = 1200;
          let targetWidth = img.width;
          let targetHeight = img.height;

          if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
            if (targetWidth > targetHeight) {
              targetHeight = Math.round((targetHeight * MAX_DIMENSION) / targetWidth);
              targetWidth = MAX_DIMENSION;
            } else {
              targetWidth = Math.round((targetWidth * MAX_DIMENSION) / targetHeight);
              targetHeight = MAX_DIMENSION;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Canvas 2D context is not available.');
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          onProgress?.(80);

          // Export full image as JPEG with 0.78 quality for crisp clarity and compact size (~60-120KB)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
          const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

          // 2. Generate lightweight micro-thumbnail (max 120px) for conversation list history (~2-4 KB)
          const THUMB_MAX = 120;
          let thumbW = img.width;
          let thumbH = img.height;
          if (thumbW > THUMB_MAX || thumbH > THUMB_MAX) {
            if (thumbW > thumbH) {
              thumbH = Math.round((thumbH * THUMB_MAX) / thumbW);
              thumbW = THUMB_MAX;
            } else {
              thumbW = Math.round((thumbW * THUMB_MAX) / thumbH);
              thumbH = THUMB_MAX;
            }
          }

          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = thumbW;
          thumbCanvas.height = thumbH;
          const thumbCtx = thumbCanvas.getContext('2d');
          if (thumbCtx) {
            thumbCtx.imageSmoothingEnabled = true;
            thumbCtx.imageSmoothingQuality = 'medium';
            thumbCtx.drawImage(img, 0, 0, thumbW, thumbH);
          }
          const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.65);

          onProgress?.(100);

          resolve({
            dataUrl,
            thumbnailUrl,
            sizeKb,
            width: targetWidth,
            height: targetHeight
          });
        } catch (err: any) {
          reject(new Error(err.message || 'Image processing failed.'));
        }
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
