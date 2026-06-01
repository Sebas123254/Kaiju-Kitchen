const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { glob } = require('glob');

// Configuration
const SRC_DIR = path.join(__dirname, '..', 'Imagenes');
const OUT_DIR = path.join(SRC_DIR, 'optimized');
const SIZES = [400, 800, 1200];

if (!fs.existsSync(SRC_DIR)) {
  console.error('Source images folder not found:', SRC_DIR);
  process.exit(1);
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

console.log('Optimizing images from', SRC_DIR, '→', OUT_DIR);

// Fallback: walk directory recursively (more robust cross-platform)
function collectImages(dir) {
  const result = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...collectImages(full));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.jpg', '.jpeg', '.png'].includes(ext)) result.push(full);
    }
  }
  return result;
}

const files = collectImages(SRC_DIR);
console.log('Found', files.length, 'image(s) to process');
(async () => {
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const base = path.basename(file, ext);
    try {
      for (const w of SIZES) {
        const outName = `${base}-${w}.webp`;
        const outPath = path.join(OUT_DIR, outName);
        await sharp(file)
          .rotate()
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(outPath);
        console.log('Wrote', outPath);
      }
      // Also write a full-size webp
      const fullOut = path.join(OUT_DIR, `${base}.webp`);
      await sharp(file).rotate().webp({ quality: 84 }).toFile(fullOut);
      console.log('Wrote', fullOut);
    } catch (e) {
      console.error('Failed to process', file, e.message);
    }
  }
  console.log('Done optimizing images.');
})();
