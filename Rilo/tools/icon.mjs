import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const [sprites, font, out] = process.argv.slice(2);
const { SPRITES, RILO_VIEWBOX } = await import(pathToFileURL(sprites).href);
const f = readFileSync(font).toString('base64');
const b = await chromium.launch({ executablePath: process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
const p = await b.newPage({ viewport: { width: 1024, height: 1024 } });
await p.setContent(`<html><head><style>@font-face{font-family:Fredoka;src:url(data:font/ttf;base64,${f});font-weight:700}body{margin:0}</style></head><body>
<svg width="1024" height="1024" viewBox="0 0 390 390"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#A6DDF0"/><stop offset=".3" stop-color="#CDEDF0"/><stop offset=".58" stop-color="#EAF6E6"/><stop offset="1" stop-color="#EEF8E6"/></linearGradient></defs>
<rect width="390" height="390" fill="url(#g)"/><circle cx="318" cy="70" r="53" fill="#FFF8D8" opacity=".55"/><circle cx="318" cy="70" r="34" fill="#FFEDA3"/>
<g transform="translate(0 150)"><path d="M0 120 C90 60 170 70 250 110 C310 140 350 120 390 90 L390 400 L0 400 Z" fill="#A8DCA0"/>
<path d="M0 190 C80 140 160 120 240 150 C300 172 340 190 390 170 L390 400 L0 400 Z" fill="#4CC160"/></g>
<svg x="35" y="70" width="320" height="280" viewBox="${RILO_VIEWBOX}">${SPRITES['original-coach'].replace(/<animateTransform[^>]*>(<\/animateTransform>)?/g,'')}</svg></svg></body></html>`);
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: out, clip: { x: 0, y: 0, width: 1024, height: 1024 } });
await b.close();
