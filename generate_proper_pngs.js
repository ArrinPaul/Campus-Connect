const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, r, g, b) {
  // Raw scanlines: width * 3 bytes per row (RGB), + 1 filter byte per row
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize);
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // Helper to make PNG chunk
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);
    const checksum = zlib.crc32(Buffer.concat([typeBuf, data]));
    crc.writeUInt32BE(checksum >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 2; // Color type: RGB
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT Chunk
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate valid 192x192 and 512x512 PNGs with Apple system blue (#007AFF -> R:0, G:122, B:255)
const icon192 = createPng(192, 192, 0, 122, 255);
const icon512 = createPng(512, 512, 0, 122, 255);
const favicon = createPng(32, 32, 0, 122, 255);

fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), icon192);
fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), icon512);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favicon);

console.log('Valid PNGs and favicon generated.');
