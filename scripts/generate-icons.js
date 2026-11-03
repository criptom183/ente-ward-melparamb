import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal PNG encoder without external dependencies
function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)) >>> 0;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function generatePng(width, height, isMaskable = false) {
  // Signature
  const sig = Buffer.from([137, 80, 78, 72, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image scanlines
  // Filter byte (0 = none) followed by RGBA bytes
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const outerR = (Math.min(width, height) / 2) * (isMaskable ? 0.95 : 0.88);
  const ringR = outerR * 0.85;
  const ringInnerR = outerR * 0.77;
  const centerR = outerR * 0.65;

  // Colors:
  // Green background: #0E5135 (14, 81, 53)
  // Gold: #D6A13C (214, 161, 60)
  // Light Gold: #F5DE98 (245, 222, 152)
  // White: (255, 255, 255)
  // Emerald inner: #166B46 (22, 107, 70)

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter byte

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let r = 14, g = 81, b = 53, a = 255; // Default deep green

      if (!isMaskable && dist > outerR) {
        // Outside circle for standard icon: transparent or smooth fade
        const edge = dist - outerR;
        if (edge > 2) {
          a = 0;
        } else {
          a = Math.max(0, Math.min(255, Math.round((1 - (edge / 2)) * 255)));
        }
      }

      if (a > 0) {
        // Gold accent ring
        if (dist >= ringInnerR && dist <= ringR) {
          r = 214; g = 161; b = 60;
        } else if (dist < centerR) {
          // Inner emerald shield/circle
          r = 20; g = 95; b = 63;
        }

        // Draw simple stylized "19" in center
        // Normalize coordinates to -1..1 within center circle
        const nx = dx / centerR;
        const ny = dy / centerR;

        // "1" digit: vertical bar at nx around -0.35, plus small top serif
        const inOneBar = (nx >= -0.42 && nx <= -0.26 && ny >= -0.55 && ny <= 0.55);
        const inOneSerif = (nx >= -0.52 && nx <= -0.35 && ny >= -0.55 && ny <= -0.35 && (nx - ny > 0.05));

        // "9" digit: loop at top (ny between -0.55 and 0.05), vertical stem right (nx between 0.22 and 0.38, ny -0.55 to 0.55), bottom tail (ny 0.40 to 0.55, nx -0.05 to 0.38)
        const d9cx = 0.16;
        const d9cy = -0.22;
        const dist9Loop = Math.sqrt((nx - d9cx) * (nx - d9cx) + (ny - d9cy) * (ny - d9cy));
        const inNineLoop = (dist9Loop <= 0.32 && dist9Loop >= 0.16);
        const inNineStem = (nx >= 0.22 && nx <= 0.38 && ny >= -0.50 && ny <= 0.55);
        const inNineTail = (nx >= -0.08 && nx <= 0.38 && ny >= 0.39 && ny <= 0.55);

        if (inOneBar || inOneSerif || inNineLoop || inNineStem || inNineTail) {
          r = 250; g = 248; b = 242; // Warm white/cream
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Generate files
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), generatePng(192, 192, false));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), generatePng(512, 512, false));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), generatePng(512, 512, true));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), generatePng(180, 180, true));
fs.writeFileSync(path.join(outDir, 'favicon.ico'), generatePng(64, 64, false));

console.log('Successfully generated all PWA icons in /public!');
