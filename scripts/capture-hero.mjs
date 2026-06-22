import { chromium } from "playwright";
import { mkdirSync } from "fs";

mkdirSync("shots", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 820 }, deviceScaleFactor: 1.5 });
await page.goto("http://localhost:5173/", { waitUntil: "load" });

// Wait for the discover button to become visible (intro animation plays first)
await page.waitForSelector(".intro__discover", { state: "visible", timeout: 20000 });
await page.waitForTimeout(400); // let its reveal animation finish
await page.click(".intro__discover");
// Wait for the outro animation + hero to mount
await page.waitForTimeout(2000);
// Scroll back to the very top (Lenis may drift during intro outro)
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await page.waitForTimeout(400);

// Hero at rest (no ink yet)
await page.screenshot({ path: "shots/hero-rest.png", timeout: 30000 });

// Short flick across the hero headline
const W = 1440, H = 820;
const N = 20;
for (let i = 0; i <= N; i++) {
  const t = i / N;
  await page.mouse.move(W * (0.18 + 0.42 * t), H * (0.5 + 0.12 * Math.sin(t * Math.PI * 2)));
  await page.waitForTimeout(14);
}
await page.screenshot({ path: "shots/hero-ink.png", timeout: 30000 });

// Let it swirl and fade
await page.waitForTimeout(600);
await page.screenshot({ path: "shots/hero-fade.png", timeout: 30000 });

await browser.close();
console.log("hero captured");
