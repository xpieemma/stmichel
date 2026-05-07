/**
 * Minimal BlurHash encoder – pure TypeScript, ~1.5 KB gzipped.
 * Takes an HTMLCanvasElement and returns a BlurHash string.
 */

const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~';

function encodeBase83(n: number, length: number): string {
  let result = '';
  for (let i = 1; i <= length; i++) {
    const digit = Math.floor(n / 83 ** (length - i)) % 83;
    result += DIGITS[digit];
  }
  return result;
}

function sRGBToLinear(value: number): number {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearTosRGB(value: number): number {
  const v = Math.max(0, Math.min(1, value));
  return v <= 0.0031308 ? v * 12.92 : v * 1.055 ** (1 / 2.4) - 0.055;
}

export function encodeBlurHash(canvas: HTMLCanvasElement, componentsX = 4, componentsY = 3): string {
  const width = canvas.width;
  const height = canvas.height;

  // Scale down to a small image for DCT
  const smallCanvas = document.createElement('canvas');
  smallCanvas.width = componentsX;
  smallCanvas.height = componentsY;
  const sctx = smallCanvas.getContext('2d')!;
  sctx.drawImage(canvas, 0, 0, componentsX, componentsY);
  const imageData = sctx.getImageData(0, 0, componentsX, componentsY);

  // Extract DC and AC components using simplified DCT
  const factors: number[] = [];

  for (let j = 0; j < componentsY; j++) {
    for (let i = 0; i < componentsX; i++) {
      let norm = 0;
      let sumR = 0, sumG = 0, sumB = 0;

      for (let y = 0; y < componentsY; y++) {
        for (let x = 0; x < componentsX; x++) {
          const basis = Math.cos((Math.PI * i * x) / componentsX) *
                        Math.cos((Math.PI * j * y) / componentsY);
          const idx = (y * componentsX + x) * 4;
          sumR += basis * sRGBToLinear(imageData.data[idx]);
          sumG += basis * sRGBToLinear(imageData.data[idx + 1]);
          sumB += basis * sRGBToLinear(imageData.data[idx + 2]);
          norm += basis;
        }
      }

      const scale = norm ? 1 / norm : 1;
      factors.push(linearTosRGB(sumR * scale));
      factors.push(linearTosRGB(sumG * scale));
      factors.push(linearTosRGB(sumB * scale));
    }
  }

  // Find maximum value for quantization
  let max = 0;
  for (let i = 0; i < factors.length; i++) {
    max = Math.max(max, Math.abs(factors[i]));
  }
  if (max === 0) max = 1;
  const quantized = factors.map(v => Math.max(0, Math.min(83 * 83 - 1, Math.floor((v * 83 * 83 - 1) / max))));

  // Encode to base83
  const sizeFlag = (componentsX - 1) + (componentsY - 1) * 9;
  let hash = encodeBase83(sizeFlag, 1);
  hash += encodeBase83(quantized[0], 4); // DC component
  for (let i = 1; i < quantized.length; i++) {
    hash += encodeBase83(quantized[i], 2);
  }
  return hash;
}