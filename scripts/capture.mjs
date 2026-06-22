import { chromium } from "playwright";
import { mkdirSync } from "fs";

const OUT = "shots";
mkdirSync(OUT, { recursive: true });

const url = process.env.URL || "http://localhost:5173/";
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 820 },
  deviceScaleFactor: 2,
});

await page.goto(url, { waitUntil: "networkidle" });

// Capture the intro at a series of timestamps to inspect choreography.
const stamps = [7200, 7900, 8400, 9000, 9800];
const t0 = Date.now();
for (const ms of stamps) {
  const wait = ms - (Date.now() - t0);
  if (wait > 0) await page.waitForTimeout(wait);
  await page.screenshot({ path: `${OUT}/intro-${String(ms).padStart(4, "0")}.png` });
}

// Capture the outro/transition.
await page.waitForTimeout(800);
await page.mouse.wheel(0, 600);
await page.waitForTimeout(450);
await page.screenshot({ path: `${OUT}/outro-mid.png` });
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/outro-end.png` });

await browser.close();
console.log("captured", stamps.length + 2, "frames");
