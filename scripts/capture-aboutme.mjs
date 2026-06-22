import { chromium } from "playwright";
import { mkdirSync } from "fs";

const OUT = "shots";
mkdirSync(OUT, { recursive: true });

const W = 1440, H = 900;
const url = process.env.URL || "http://localhost:5173/";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: "load", timeout: 60000 });

// dismiss intro — wait until the DISCOVER button is actually ready (its
// click/wheel handlers only attach once the intro timeline completes), then
// nudge it away and wait for the intro to detach.
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
    const steps = 24;
    for (let i = 1; i <= steps; i++) {
      window.scrollTo(0, start + (target - start) * (i / steps));
      await new Promise((r) => setTimeout(r, 22));
    }
  }, y);

const sectionTop = await page.evaluate(() => {
  const el = document.getElementById("about-me");
  return el.getBoundingClientRect().top + window.scrollY;
});

// black → grey → white as the section enters
await scrollTo(sectionTop - H * 1.0);   // black
await page.waitForTimeout(500);
await shot("am-1-black");

await scrollTo(sectionTop - H * 0.58);  // grey midpoint
await page.waitForTimeout(500);
await shot("am-2-grey");

await scrollTo(sectionTop - H * 0.12);  // white
await page.waitForTimeout(500);
await shot("am-3-white");

// centre the gallery to show the parallax-revealed portraits
const galleryY = await page.evaluate(() => {
  const el = document.querySelector(".aboutme__gallery");
  return el.getBoundingClientRect().top + window.scrollY - (window.innerHeight - el.getBoundingClientRect().height) / 2;
});
await scrollTo(galleryY);
await page.waitForTimeout(900);
await shot("am-4-gallery");

// hover the centre frame with motion to fire the liquid distortion
const box = await page.evaluate(() => {
  const el = document.querySelector(".aboutme__frame--center");
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
});
const cx = box.x + box.w / 2;
const cy = box.y + box.h / 2;
await page.mouse.move(cx, box.y + box.h * 0.85, { steps: 4 });
const N = 40;
for (let i = 0; i <= N; i++) {
  const t = i / N;
  const x = cx + Math.cos(t * Math.PI * 4) * box.w * 0.32;
  const y = cy + (0.35 - t * 0.7) * box.h + Math.sin(t * Math.PI * 4) * box.h * 0.12;
  await page.mouse.move(x, y, { steps: 2 });
  await page.waitForTimeout(16);
}
await shot("am-5-hover");

// settle back (distortion relaxes)
await page.mouse.move(40, 40);
await page.waitForTimeout(700);
await shot("am-6-settle");

await browser.close();
console.log("captured about-me frames");
