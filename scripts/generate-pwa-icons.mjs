/**
 * public/favicon.png dosyasından PWA için 192x192 ve 512x512 ikonlar üretir.
 * Build öncesi çalıştırılır: npm run prebuild
 */
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const faviconPath = join(publicDir, 'favicon.png');

async function main() {
  const buf = await readFile(faviconPath);
  await sharp(buf).resize(192, 192).toFile(join(publicDir, 'pwa-192.png'));
  await sharp(buf).resize(512, 512).toFile(join(publicDir, 'pwa-512.png'));
  console.log('PWA ikonları: pwa-192.png ve pwa-512.png oluşturuldu.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
