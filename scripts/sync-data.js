const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', 'data', 'stats.json');
const destDir = path.resolve(__dirname, '..', 'public', 'data');
const dest = path.join(destDir, 'stats.json');

try {
  if (!fs.existsSync(src)) throw new Error('source file not found: ' + src);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
  console.log('synced data:', src, '->', dest);
} catch (err) {
  console.error('failed to sync data:', err.message);
  process.exit(1);
}
