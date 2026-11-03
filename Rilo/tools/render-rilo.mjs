// Renders every Rilo sprite (app/src/rilo/sprites.js, the exact markup the web
// demo shows) to PNG image sets in the iOS asset catalog.
//  {skin}-{mood}            full art, built-in animation frozen at rest
//  {skin}-wave-base/arm/top wave split into 3 layers so SwiftUI can rotate the arm
// usage: node render-rilo.mjs <sprites.js> <fonts dir> <out .xcassets/Rilo dir>
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [spritesPath, fontsDir, outDir] = process.argv.slice(2);
const { SPRITES, SKINS, MOODS, RILO_VIEWBOX } = await import(pathToFileURL(spritesPath).href);
const SCALE = 4; // 208x182 viewBox -> 832x728 px

const fontB64 = readFileSync(join(fontsDir, 'Fredoka-Bold.ttf')).toString('base64');

// split markup at the <g> that holds the rotate animateTransform
function splitWave(markup) {
  const i = markup.indexOf('<animateTransform attributeName="transform" type="rotate"');
  if (i < 0) return null;
  const start = markup.lastIndexOf('<g', i);
  let depth = 0;
  const re = /<g[\s>]|<\/g>/g;
  re.lastIndex = start;
  let m;
  let end = -1;
  while ((m = re.exec(markup))) {
    if (m[0].startsWith('</')) depth -= 1;
    else depth += 1;
    if (depth === 0) { end = m.index + 4; break; }
  }
  return { base: markup.slice(0, start), arm: markup.slice(start, end), top: markup.slice(end) };
}

const strip = (s) => s.replace(/<animateTransform[^>]*>(<\/animateTransform>)?/g, '');

const browser = await chromium.launch({ executablePath: process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
const page = await browser.newPage({ viewport: { width: 208, height: 182 }, deviceScaleFactor: SCALE });

async function render(markup, name) {
  const html = `<!doctype html><html><head><style>
    @font-face { font-family: Fredoka; src: url(data:font/ttf;base64,${fontB64}); font-weight: 700; }
    html,body{margin:0;background:transparent}
  </style></head><body>
  <svg width="208" height="182" viewBox="${RILO_VIEWBOX}" xmlns="http://www.w3.org/2000/svg">${strip(markup)}</svg>
  </body></html>`;
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  const buf = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: 208, height: 182 } });
  const dir = join(outDir, `rilo-${name}.imageset`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `rilo-${name}.png`), buf);
  writeFileSync(join(dir, 'Contents.json'), JSON.stringify({
    images: [{ idiom: 'universal', filename: `rilo-${name}.png`, scale: '3x' }],
    info: { author: 'xcode', version: 1 },
  }, null, 2));
}

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'Contents.json'), JSON.stringify({ info: { author: 'xcode', version: 1 }, properties: { 'provides-namespace': false } }, null, 2));

let n = 0;
const noTop = [];
for (const skin of SKINS) {
  for (const mood of MOODS) {
    const markup = SPRITES[`${skin}-${mood}`];
    await render(markup, `${skin}-${mood}`); n++;
    if (mood === 'wave') {
      const parts = splitWave(markup);
      if (!parts) { console.error('no arm in', skin); continue; }
      await render(parts.base, `${skin}-wave-base`);
      await render(parts.arm, `${skin}-wave-arm`);
      await render(parts.top, `${skin}-wave-top`);
      n += 3;
      if (!parts.top.trim()) noTop.push(skin);
    }
  }
}
console.log('rendered', n, 'images; wave skins with empty top layer:', noTop.length);
await browser.close();
