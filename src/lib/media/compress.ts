/**
 * Adaptive image compression using the Network Information API.
 * Falls back to a sensible default when the API is unavailable.
 */

type EffectiveConnectionType = 'slow-2g' | '2g' | '3g' | '4g';

function getQualityFromNetwork(): number {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return 0.7; // default
  }
  const conn = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
  if (!conn || !conn.effectiveType) return 0.7;

  const type = conn.effectiveType as EffectiveConnectionType;
  switch (type) {
    case '4g': return 0.8;
    case '3g': return 0.6;
    case '2g': case 'slow-2g': return 0.4;
    default: return 0.7;
  }
}

/**
 * Resize and compress an image File to a JPEG blob.
 * @param file   The original image file from an <input type="file">.
 * @param qualityOverride Optional explicit quality (0.0–1.0). If omitted, determined by network speed.
 * @param maxDimension   Maximum width or height (default 1920). The image is scaled down preserving aspect ratio.
 * @returns A promise resolving to a JPEG Blob ready for upload to R2/OPFS.
 */
export async function compressImage(
  file: File,
  qualityOverride?: number,
  maxDimension = 1920
): Promise<Blob> {
  const quality = qualityOverride ?? getQualityFromNetwork();

  // Load the image into an off-screen canvas
  const imageBitmap = await createImageBitmap(file);
  const { width, height } = imageBitmap;

  // Calculate new dimensions if the image exceeds maxDimension
  let newWidth = width;
  let newHeight = height;
  if (width > maxDimension || height > maxDimension) {
    const ratio = Math.min(maxDimension / width, maxDimension / height);
    newWidth = Math.round(width * ratio);
    newHeight = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(imageBitmap, 0, 0, newWidth, newHeight);

  // Convert to JPEG blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to compress image'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}