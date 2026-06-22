import { chromium } from "playwright";
import { mkdirSync } from "fs";

const OUT = "shots";
mkdirSync(OUT, { recursive: true });

const url = process.env.URL || "http://localhost:5173/";
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
await page.goto(url, { waitUntil: "load", timeout: 60000 });

// dismiss intro by clicking DISCOVER (robust path)
await page.waitForTimeout(9500);
await page.click(".intro__discover", { timeout: 5000 }).catch(async () => {
  await page.mouse.wheel(0, 800);
});
await page.waitForTimeout(2000);

// trigger all 4 zones so the continue affordance shows
const W = 1440, H = 900;
const zones = [[0.46,0.74],[0.45,0.86],[0.48,0.4],[0.62,0.22]];
for (const [ux,uy] of zones){
  await page.mouse.move(ux*W,(1-uy)*H,{steps:8});
  await page.waitForTimeout(700);
}
await page.mouse.move(120,120);
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/site-living.png`, timeout: 60000, clip: { x:0, y:0, width:1440, height:900 } });

// Scroll through the rest. Disable Lenis smoothing for deterministic capture.
const sections = ["work","about","clients","awards","contact"];
for (const id of sections){
  // smooth-step scroll to the target so ScrollTriggers fire naturally
  const targetY = await page.evaluate((sel) => {
    const el = document.getElementById(sel);
    return el ? el.getBoundingClientRect().top + window.scrollY : window.scrollY;
  }, id);
  await page.evaluate(async (y) => {
    const start = window.scrollY;
    const steps = 18;
    for (let i = 1; i <= steps; i++) {
      window.scrollTo(0, start + (y - start) * (i / steps));
      await new Promise((r) => setTimeout(r, 35));
    }
  }, targetY);
  await page.waitForTimeout(1400);
  await page.screenshot({
    path: `${OUT}/site-${id}.png`,
    timeout: 60000,
    clip: { x: 0, y: 0, width: 1440, height: 900 },
  });
}

await browser.close();
console.log("captured full-site frames");
