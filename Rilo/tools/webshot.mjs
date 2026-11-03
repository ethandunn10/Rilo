// Screenshot the web demo at 390x844 after a list of steps.
// usage: node webshot.mjs '<json steps>'
// steps: [{"click":"let's go"}, {"fill":["input","Sam"]}, {"wait":800},
//         {"eval":"js"}, {"shot":"/abs/path.png"}, {"clickSel":"css"}]
// "click" matches a button/link by its visible text (exact first, then contains).
import { chromium } from 'playwright';

const steps = JSON.parse(process.argv[2]);
const url = process.env.WEB_URL || 'http://localhost:5199/';
const browser = await chromium.launch({
  executablePath: process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell',
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true });
await page.goto(url);
await page.evaluate(() => localStorage.clear());
await page.goto(url);
await page.waitForTimeout(900);
for (const s of steps) {
  if (s.click) {
    let loc = page.getByRole('button', { name: s.click, exact: true });
    if ((await loc.count()) === 0) loc = page.getByText(s.click, { exact: true });
    if ((await loc.count()) === 0) loc = page.getByText(s.click);
    await loc.first().click({ timeout: 5000 });
    await page.waitForTimeout(s.after ?? 700);
  } else if (s.clickSel) {
    await page.locator(s.clickSel).first().click({ timeout: 5000 });
    await page.waitForTimeout(s.after ?? 700);
  } else if (s.fill) {
    await page.locator(s.fill[0]).first().fill(s.fill[1]);
    await page.waitForTimeout(300);
  } else if (s.wait) {
    await page.waitForTimeout(s.wait);
  } else if (s.eval) {
    await page.evaluate(s.eval);
    await page.waitForTimeout(300);
  } else if (s.shot) {
    await page.screenshot({ path: s.shot });
    console.log('saved', s.shot);
  } else if (s.dump) {
    const t = await page.evaluate(() => document.body.innerText);
    console.log(t.slice(0, 1500));
  }
}
await browser.close();
