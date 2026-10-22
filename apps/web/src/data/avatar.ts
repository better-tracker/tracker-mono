import {
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_SIZE_BYTES,
  MAX_AVATAR_SIZE_MB,
} from './constants';

export async function readAvatar(file: File): Promise<string> {
  if (
    !ALLOWED_AVATAR_TYPES.some((type) => type === file.type) ||
    file.size > MAX_AVATAR_SIZE_BYTES
  ) {
    throw new Error(
      `Choose a PNG, JPEG or WebP image smaller than ${MAX_AVATAR_SIZE_MB} MB.`,
    );
  }

  try {
    const bitmap = await createImageBitmap(file);
    bitmap.close();
  } catch {
    throw new Error('Unable to open that image. Please choose another.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reader.onabort = () =>
      reject(new Error('Unable to read that image. Please choose another.'));
    try {
      reader.readAsDataURL(file);
    } catch {
      reject(new Error('Unable to open that image. Please choose another.'));
    }
  });
}
