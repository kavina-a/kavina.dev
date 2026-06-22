import { chromium } from "playwright";
import { mkdirSync } from "fs";

mkdirSync("shots", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 820 }, deviceScaleFactor: 1.5 });
await page.goto("http://localhost:5173/#paint", { waitUntil: "load" });
await page.waitForTimeout(1500);

const W = 1440, H = 820;
// short, realistic flick — like a user quickly dragging across ~30% of screen
const N = 20;
for (let i = 0; i <= N; i++) {
  const t = i / N;
  const x = W * (0.38 + 0.28 * t);
  const y = H * (0.45 + 0.14 * Math.sin(t * Math.PI * 1.8));
  await page.mouse.move(x, y);
  await page.waitForTimeout(16);
  if (i === N) {
    await page.screenshot({ path: "shots/paint-1.png", timeout: 60000 });
  }
}

// let the vorticity swirl it for 500ms then snapshot the snap-off
await page.waitForTimeout(500);
await page.screenshot({ path: "shots/paint-2.png", timeout: 60000 });

await browser.close();
console.log("captured fluid frames");
