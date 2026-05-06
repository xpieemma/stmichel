/**
 * Minimal zero‑dependency QR code SVG generator.
 * Supports byte mode, ECC level M (Medium), auto‑chooses smallest version.
 * Returns an SVG string with a white background and black modules.
 */

// ─────────────────────────────────────────────────────────────────
//  Galois field operations (QR uses GF(2^8) with irreducible polynomial 0x11D)
// ─────────────────────────────────────────────────────────────────
function gfAdd(a: number, b: number) { return a ^ b; }
function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a;
    const hi = a & 0x80;
    a <<= 1;
    if (hi) a ^= 0x11d;
    b >>= 1;
  }
  return p;
}
function gfExp(power: number): number {
  if (power < 0) return 0;
  let v = 1;
  for (let i = 0; i < power; i++) v = (v << 1) ^ ((v & 0x80) ? 0x11d : 0);
  return v;
}

// ─────────────────────────────────────────────────────────────────
//  Pre‑computed tables (constant)
// ─────────────────────────────────────────────────────────────────

// Total codewords capacity per version (1-20)
const TOTAL_CODEWORDS: number[] = [
  0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346, 
  404, 466, 532, 581, 655, 733, 815, 901, 991, 1085
];

// Number of data codewords per version (1‑20) for ECC level M
const DATA_CODEWORDS: number[] = [
  0, 16, 28, 44, 64, 86, 108, 124, 154, 182, 216, 
  254, 290, 334, 365, 415, 453, 507, 563, 617, 677,
];

// Generator polynomials correctly built over GF(2^8)
const ECC_GENERATORS: number[][] = [[1]];
{
  const maxEcc = 30; // Pre-generate enough for ECC M up to version 20
  for (let i = 0; i < maxEcc; i++) {
    const prev = ECC_GENERATORS[i];
    const next = new Array(prev.length + 1).fill(0);
    for (let j = 0; j < prev.length; j++) {
      next[j] = gfAdd(next[j], prev[j]); // Multiply by x
      next[j + 1] = gfAdd(next[j + 1], gfMul(prev[j], gfExp(i))); // Multiply by a^i
    }
    ECC_GENERATORS.push(next);
  }
}

// ─────────────────────────────────────────────────────────────────
//  QR matrix creation
// ─────────────────────────────────────────────────────────────────
type QrMatrix = (boolean | null)[][];

function createModules(version: number): QrMatrix {
  const size = 17 + version * 4;
  const modules: QrMatrix = Array.from({ length: size }, () => Array(size).fill(null));

  const finder = [
    [true, true, true, true, true, true, true],
    [true, false, false, false, false, false, true],
    [true, false, true, true, true, false, true],
    [true, false, true, true, true, false, true],
    [true, false, true, true, true, false, true],
    [true, false, false, false, false, false, true],
    [true, true, true, true, true, true, true],
  ];
  
  const fill = (ox: number, oy: number) => {
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 7; c++) modules[oy + r][ox + c] = finder[r][c];
  };
  
  fill(0, 0); // top‑left
  fill(size - 7, 0); // top‑right
  fill(0, size - 7); // bottom‑left

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    modules[6][i] = i % 2 === 0;
    modules[i][6] = i % 2 === 0;
  }

  // Alignment patterns
  if (version >= 2) {
    const positions = getAlignmentPositions(version);
    const align = [
      [true, true, true, true, true],
      [true, false, false, false, true],
      [true, false, true, false, true],
      [true, false, false, false, true],
      [true, true, true, true, true],
    ];
    for (const ay of positions) {
      for (const ax of positions) {
        if ((ax === 6 && ay === 6) || (ax === 6 && ay === positions[positions.length - 1]) ||
            (ax === positions[positions.length - 1] && ay === 6)) continue;
            
        for (let r = 0; r < 5; r++)
          for (let c = 0; c < 5; c++) modules[ay - 2 + r][ax - 2 + c] = align[r][c];
      }
    }
  }

  return modules;
}

function getAlignmentPositions(version: number): number[] {
  if (version === 1) return [];
  const size = 17 + version * 4;
  const step = version < 7 ? 2 : (version < 14 ? 3 : 4);
  const coords = [6, size - 7];
  const totalIntervals = step + 1;
  for (let i = 1; i <= step; i++) {
    coords.push(6 + Math.floor(i * (size - 13) / totalIntervals));
  }
  return coords.sort((a, b) => a - b);
}

// ─────────────────────────────────────────────────────────────────
//  Data encoding and ECC calculation
// ─────────────────────────────────────────────────────────────────
function encodeData(data: Uint8Array, version: number): boolean[] {
  const dataBits: boolean[] = [];
  dataBits.push(false, true, false, false); // 0100 (byte mode)
  
  const countLen = version < 10 ? 8 : 16;
  const count = data.length;
  for (let i = countLen - 1; i >= 0; i--) dataBits.push(((count >> i) & 1) === 1);
  
  for (const b of data) {
    for (let i = 7; i >= 0; i--) dataBits.push(((b >> i) & 1) === 1);
  }
  
  const totalBits = DATA_CODEWORDS[version] * 8;
  while (dataBits.length < totalBits && dataBits.length % 8 !== 0) dataBits.push(false);
  while (dataBits.length < totalBits) {
    if (dataBits.length + 4 <= totalBits) dataBits.push(false, false, false, false);
    else dataBits.push(false);
  }
  while (dataBits.length % 8 !== 0) dataBits.push(false);
  
  const padBytes = [
    [true, true, true, false, true, true, false, false],   // 0xEC
    [false, false, false, true, false, false, false, true], // 0x11
  ];
  let idx = 0;
  while (dataBits.length < totalBits) {
    const byte = padBytes[idx % 2];
    for (let i = 0; i < 8; i++) dataBits.push(byte[i]);
    idx++;
  }
  return dataBits;
}

function computeECC(dataBits: boolean[], version: number): boolean[] {
  const dataCount = DATA_CODEWORDS[version];
  const eccCount = TOTAL_CODEWORDS[version] - dataCount;

  // Group bits into bytes for Galois Field division
  const msgBytes: number[] = [];
  for (let i = 0; i < dataBits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) if (dataBits[i + j]) b |= (1 << (7 - j));
    msgBytes.push(b);
  }

  // Pad message for polynomial division
  const generator = ECC_GENERATORS[eccCount];
  for (let i = 0; i < eccCount; i++) msgBytes.push(0);

  for (let i = 0; i < dataCount; i++) {
    const factor = msgBytes[i];
    if (factor !== 0) {
      for (let j = 0; j < generator.length; j++) {
        msgBytes[i + j] = gfAdd(msgBytes[i + j], gfMul(generator[j], factor));
      }
    }
  }

  // Extract ECC bytes and convert back to bits
  const eccBits: boolean[] = [];
  for (let i = 0; i < eccCount; i++) {
    const eccByte = msgBytes[dataCount + i];
    for (let j = 7; j >= 0; j--) eccBits.push(((eccByte >> j) & 1) === 1);
  }
  return eccBits;
}

// ─────────────────────────────────────────────────────────────────
//  Module placement and format info
// ─────────────────────────────────────────────────────────────────
function placeDataAndMask(modules: QrMatrix, dataBits: boolean[]) {
  const size = modules.length;
  let row = size - 1;
  let col = size - 1;
  let dirUp = -1;
  let idx = 0;
  
  while (col >= 0 && idx < dataBits.length) {
    if (col === 6) col--; // skip vertical timing column
    while (row >= 0 && row < size && idx < dataBits.length) {
      for (let c = 0; c < 2; c++) {
        const x = col - c;
        if (x >= 0 && modules[row][x] === null) {
          let bit = dataBits[idx++];
          // Apply mask pattern 0 inline: (row + col) % 2 === 0
          // This isolates the mask so it NEVER touches finder/timing patterns
          if ((row + x) % 2 === 0) bit = !bit;
          modules[row][x] = bit;
        }
      }
      row += dirUp;
    }
    dirUp = -dirUp;
    row += dirUp;
    col -= 2;
  }
}

function addFormatInfo(modules: QrMatrix) {
  // ECC level M (0) + mask pattern 0 (000) -> XORed format bits
  const formatBits = [true, false, true, false, true, false, false, false, false, false, true, false, false, true, false];
  const size = modules.length;
  let i = 0;
  for (let r = 0; r < 6; r++) modules[r][8] = formatBits[i++];
  for (let c = 8; c >= 0; c--) modules[8][c] = formatBits[i++];
  for (let r = size - 1; r >= size - 7; r--) modules[r][8] = formatBits[i++];
  for (let c = 8; c < size - 8; c++) modules[8][c] = formatBits[i++];
}

// ─────────────────────────────────────────────────────────────────
//  Public API
// ─────────────────────────────────────────────────────────────────
export function renderQRCode(data: string): string {
  const bytes = new TextEncoder().encode(data);
  let version = 1;
  const MAX_VERSION = 20;
  
  while (version <= MAX_VERSION) {
    const capacityCodewords = DATA_CODEWORDS[version];
    const overhead = 2 + (version < 10 ? 1 : 2) + 2 + 4; 
    if (bytes.length + overhead <= capacityCodewords) break;
    version++;
  }
  if (version > MAX_VERSION) throw new Error('Data too long for QR code');

  const dataBits = encodeData(bytes, version);
  const ecc = computeECC(dataBits, version);
  const allBits = [...dataBits, ...ecc];

  const modules = createModules(version);
  placeDataAndMask(modules, allBits); // Replaces `applyMask`
  addFormatInfo(modules);

  const size = modules.length;
  const modulePx = 5;
  const svgSize = size * modulePx;
  let svg = `<svg viewBox="0 0 ${svgSize} ${svgSize}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${svgSize}" height="${svgSize}" fill="white"/>`;
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // modules[r][c] evaluates to true for black modules (null remains white)
      if (modules[r][c]) {
        svg += `<rect x="${c * modulePx}" y="${r * modulePx}" width="${modulePx}" height="${modulePx}" fill="black"/>`;
      }
    }
  }
  svg += `</svg>`;
  return svg;
}