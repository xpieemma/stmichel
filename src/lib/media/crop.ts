/**
 * Extract a cropped region from an Image element into a new canvas.
 * @param image  loaded HTMLImageElement
 * @param sx, sy, sw, sh  source rectangle (in image coordinates)
 * @returns a canvas of exactly sw × sh with the cropped content
 */
export function cropImageToCanvas(
  image: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas;
}

/**
 * Convert a canvas to a JPEG Blob.
 */
export function canvasToJpegBlob(canvas: HTMLCanvasElement, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      'image/jpeg',
      quality
    );
  });
}