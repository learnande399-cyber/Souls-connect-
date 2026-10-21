import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  // Type validation: JPEG, PNG, WebP
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload a JPEG, PNG, or WebP photo.'
    };
  }

  // Size validation: up to 5 MB
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeInMB} MB). Maximum allowed size is 5 MB.`
    };
  }

  return { valid: true };
}

export async function uploadPostImage(
  file: File,
  userId: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Sanitize filename and create unique timestamped path
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `posts/${userId}/${Date.now()}_${sanitizedName}`;
  const storageRef = ref(storage, path);

  const metadata = {
    contentType: file.type,
    customMetadata: {
      uploadedBy: userId,
      uploadedAt: new Date().toISOString()
    }
  };

  const uploadTask = uploadBytesResumable(storageRef, file, metadata);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0) {
          const percent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          onProgress?.(percent);
        }
      },
      (error) => {
        console.error('Firebase Storage upload error:', error);
        let userMessage = 'Failed to upload photo. Please try again.';
        if (error.code === 'storage/unauthorized') {
          userMessage = 'Permission denied. You must be signed in to upload photos.';
        } else if (error.code === 'storage/canceled') {
          userMessage = 'Upload was canceled.';
        } else if (error.code === 'storage/quota-exceeded') {
          userMessage = 'Storage quota exceeded. Please contact platform support.';
        } else if (error.code === 'storage/retry-limit-exceeded') {
          userMessage = 'Upload timed out. Please check your internet connection.';
        }
        reject(new Error(userMessage));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          onProgress?.(100);
          resolve(downloadUrl);
        } catch (urlError: any) {
          console.error('Error fetching download URL:', urlError);
          reject(new Error('Could not retrieve uploaded photo URL.'));
        }
      }
    );
  });
}
