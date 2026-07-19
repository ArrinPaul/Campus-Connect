const fs = require('fs');
const path = require('path');

// Minimal valid 1x1 transparent PNG buffer
const minimalPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), minimalPng);
fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), minimalPng);

console.log('Icons created successfully.');
