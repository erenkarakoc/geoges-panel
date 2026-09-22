#!/usr/bin/env node
/**
 * Draws the Home Screen icons of the panel from the brand mark (TASK-0113, D-264).
 *
 * A phone cannot use an SVG for its Home Screen: Android wants 192 and 512 px PNGs plus a
 * maskable one it may crop to any shape, and an iPhone wants a 180 px `apple-touch-icon` with no
 * transparency. All four are the white mark on the brand blue, so the icon reads the same on a
 * light and a dark Home Screen. Re-run after the brand mark changes:
 *
 *   node scripts/make-app-icons.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { createCanvas, loadImage } from "@napi-rs/canvas";

const ROOT = resolve(import.meta.dirname, "..");
const MARK = resolve(ROOT, "public/assets/brand/icon_light.svg");
const BRAND = "#0F4C81";

/** Share of the icon's width the mark may fill; a maskable icon is cropped, so it stays smaller. */
const ICONS = [
  { file: "public/assets/brand/app-icon-192.png", size: 192, fill: 0.62 },
  { file: "public/assets/brand/app-icon-512.png", size: 512, fill: 0.62 },
  { file: "public/assets/brand/app-icon-maskable-512.png", size: 512, fill: 0.44 },
  { file: "public/apple-touch-icon.png", size: 180, fill: 0.62 },
];

const mark = await loadImage(readFileSync(MARK));

for (const icon of ICONS) {
  const canvas = createCanvas(icon.size, icon.size);
  const context = canvas.getContext("2d");
  context.fillStyle = BRAND;
  context.fillRect(0, 0, icon.size, icon.size);
  const width = icon.size * icon.fill;
  const height = (width * mark.height) / mark.width;
  context.drawImage(mark, (icon.size - width) / 2, (icon.size - height) / 2, width, height);
  writeFileSync(resolve(ROOT, icon.file), canvas.toBuffer("image/png"));
  console.log(`wrote ${icon.file} (${icon.size}px)`);
}
