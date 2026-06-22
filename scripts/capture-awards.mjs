import { chromium } from "playwright";
import { mkdirSync } from "fs";

const OUT = "shots";
mkdirSync(OUT, { recursive: true });

const W = 1440, H = 900;
const url = process.env.URL || "http://localhost:5173/";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: "load", timeout: 60000 });

// dismiss intro robustly
await page.waitForSelector(".intro__discover", { state: "visible", timeout: 30000 });
await page.waitForFunction(() => {
  const b = document.querySelector(".intro__discover");
  return b && parseFloat(getComputedStyle(b).opacity) > 0.9;
}, { timeout: 30000 });
for (let i = 0; i < 20; i++) {
  if (!(await page.$(".intro"))) break;
  await page.mouse.wheel(0, 600);
  await page.click(".intro__discover").catch(() => {});
  await page.waitForTimeout(400);
}
await page.waitForSelector(".intro", { state: "detached", timeout: 10000 }).catch(() => {});
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);

const shot = (name) =>
  page.screenshot({ path: `${OUT}/${name}.png`, clip: { x: 0, y: 0, width: W, height: H }, timeout: 60000 });

const scrollTo = (y) =>
  page.evaluate(async (target) => {
    const start = window.scrollY;
    const steps = 30;
    for (let i = 1; i <= steps; i++) {
      window.scrollTo(0, start + (target - start) * (i / steps));
      await new Promise((r) => setTimeout(r, 18));
    }
  }, y);

// pin start = section offsetTop (ScrollTrigger start "top top"); pinned for 300%
const pinStart = await page.evaluate(() => {
  const el = document.getElementById("awards");
  return el.getBoundingClientRect().top + window.scrollY;
});
const span = 3 * H;

const points = [
  ["aw-0-initial", 0.02],
  ["aw-1-diverge", 0.16],
  ["aw-2-divergemax", 0.3],
  ["aw-3-zoom", 0.5],
  ["aw-4-reveal", 0.88],
];

for (const [name, p] of points) {
  await scrollTo(pinStart + span * p);
  await page.waitForTimeout(900);
  await shot(name);
}

await browser.close();
console.log("captured awards frames");
