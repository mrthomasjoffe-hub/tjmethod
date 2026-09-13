#!/usr/bin/env node
// Generates the PNG app icons and iOS launch screens for The Foundry PWA.
// Zero dependencies — raw PNG encoder (RGB, filter 0) + zlib deflate.
// Run: node tools/make-icons.mjs

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'foundry', 'icons');

const INK = [0x1c, 0x1b, 0x17];
const COPPER = [0xc0, 0x8a, 0x3e];

// A serif "F" described in a unit box (x, y run 0..1, y downwards).
const GLYPH = [
  [0.18, 0.02, 0.92, 0.17],   // top bar
  [0.84, 0.17, 0.92, 0.27],   // top bar right serif
  [0.38, 0.02, 0.55, 0.86],   // stem
  [0.55, 0.42, 0.81, 0.55],   // middle bar
  [0.74, 0.55, 0.81, 0.63],   // middle bar serif
  [0.22, 0.86, 0.71, 1.0],    // foot serif
];

function crcTable() {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
}
const CRC = crcTable();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(width, height, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 2;   // colour type: truecolour
  const raw = Buffer.alloc(height * (width * 3 + 1));
  let p = 0;
  for (let y = 0; y < height; y++) {
    raw[p++] = 0; // filter: none
    pixels.copy(raw, p, y * width * 3, (y + 1) * width * 3);
    p += width * 3;
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Draws the copper F on an ink ground. `scale` is the glyph height as a
// fraction of the shorter side, so a wide launch screen keeps the mark small.
function render(width, height, scale) {
  const buf = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    buf[i * 3] = INK[0];
    buf[i * 3 + 1] = INK[1];
    buf[i * 3 + 2] = INK[2];
  }
  const short = Math.min(width, height);
  const gh = short * scale;
  const gw = gh * 0.86;
  const x0 = (width - gw) / 2;
  const y0 = (height - gh) / 2;
  for (const [ax, ay, bx, by] of GLYPH) {
    const left = Math.round(x0 + ax * gw);
    const right = Math.round(x0 + bx * gw);
    const top = Math.round(y0 + ay * gh);
    const bottom = Math.round(y0 + by * gh);
    for (let y = top; y < bottom; y++) {
      if (y < 0 || y >= height) continue;
      for (let x = left; x < right; x++) {
        if (x < 0 || x >= width) continue;
        const i = (y * width + x) * 3;
        buf[i] = COPPER[0];
        buf[i + 1] = COPPER[1];
        buf[i + 2] = COPPER[2];
      }
    }
  }
  return buf;
}

function write(name, width, height, scale) {
  const file = join(OUT, name);
  writeFileSync(file, png(width, height, render(width, height, scale)));
  console.log(`  ${name}  ${width}x${height}`);
}

mkdirSync(OUT, { recursive: true });
console.log('icons →');
// iOS home screen (iOS applies its own corner mask, so go close to full bleed).
write('apple-touch-icon.png', 180, 180, 0.52);
// Web app manifest.
write('icon-192.png', 192, 192, 0.52);
write('icon-512.png', 512, 512, 0.52);
// Maskable: everything important inside the middle 60%.
write('icon-maskable-512.png', 512, 512, 0.38);

console.log('launch screens →');
const SPLASH = [
  [1320, 2868], [1206, 2622], [1290, 2796], [1179, 2556], [1170, 2532],
  [1242, 2688], [1125, 2436], [828, 1792], [750, 1334], [1536, 2048],
];
for (const [w, h] of SPLASH) {
  write(`splash-${w}x${h}.png`, w, h, 0.14);
  write(`splash-${h}x${w}.png`, h, w, 0.14);
}
