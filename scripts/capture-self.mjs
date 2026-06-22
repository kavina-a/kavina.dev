import { chromium } from "playwright";
import { mkdirSync } from "fs";

const OUT = "shots";
mkdirSync(OUT, { recursive: true });

const url = process.env.URL || "http://localhost:5173/";
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 820 },
  deviceScaleFactor: 1.5,
});

await page.goto(url, { waitUntil: "networkidle" });

// Skip the intro: wait for it to be ready then scroll to dismiss.
await page.waitForTimeout(9500);
await page.mouse.wheel(0, 800);
await page.waitForTimeout(1500);

// idle (no zone) state
await page.mouse.move(200, 200);
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/self-idle.png` });

// Zone sweep. Zones are in uv (bottom-left). Convert to screen px.
const W = 1440, H = 820;
const zones = {
  know: [0.46, 0.74],
  build: [0.45, 0.86],
  love: [0.48, 0.4],
  chase: [0.62, 0.22],
};
for (const [name, [ux, uy]] of Object.entries(zones)) {
  const x = ux * W;
  const y = (1 - uy) * H;
  // ease the cursor in a few steps so lerp + ripple settle
  await page.mouse.move(x, y, { steps: 12 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/self-${name}.png` });
}

await browser.close();
console.log("captured living-self frames");
