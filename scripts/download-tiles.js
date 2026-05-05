#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bounds = { minLat: 19.35, maxLat: 19.42, minLng: -72.35, maxLng: -72.28 };
const zoomLevels = [13, 14, 15, 16];
const outputDir = path.join(__dirname, '../static/map-tiles');
const tileUrl = (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

function latLngToTile(lat, lng, zoom) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2) * n);
  return { x, y };
}

async function downloadTile(z, x, y) {
  const dir = path.join(outputDir, z.toString(), x.toString());
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${y}.png`);
  if (fs.existsSync(filePath)) return;
  return new Promise((resolve, reject) => {
    https.get(tileUrl(z, x, y), (res) => {
      if (res.statusCode !== 200) { reject(`Failed: ${res.statusCode}`); return; }
      const file = fs.createWriteStream(filePath);
      res.pipe(file);
      file.on('finish', () => { file.close(); console.log(`Downloaded: ${z}/${x}/${y}.png`); resolve(); });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Downloading map tiles for St Michel de l\'Attalaye...');
  for (const zoom of zoomLevels) {
    const tl = latLngToTile(bounds.maxLat, bounds.minLng, zoom);
    const br = latLngToTile(bounds.minLat, bounds.maxLng, zoom);
    console.log(`Zoom ${zoom}: tiles from (${tl.x},${tl.y}) to (${br.x},${br.y})`);
    for (let x = tl.x; x <= br.x; x++) {
      for (let y = tl.y; y <= br.y; y++) {
        try { await downloadTile(zoom, x, y); await new Promise(r => setTimeout(r, 100)); }
        catch (e) { console.error(e); }
      }
    }
  }
  console.log('Done!');
}
main().catch(console.error);
