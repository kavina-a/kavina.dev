import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 820 } });
const logs = [];
page.on("console", (m) => logs.push(m.text()));
page.on("pageerror", (e) => logs.push("PAGEERROR: " + e.message));
await page.goto("http://localhost:5173/#paint", { waitUntil: "load" });
await page.waitForTimeout(1200);

const info = await page.evaluate(() => {
  const c = document.querySelector(".paint__canvas");
  const gl = c.getContext("webgl2") || c.getContext("webgl");
  return {
    cssW: c.clientWidth,
    cssH: c.clientHeight,
    bufW: c.width,
    bufH: c.height,
    hasGL: !!gl,
    rect: c.getBoundingClientRect(),
  };
});
console.log("CANVAS INFO:", JSON.stringify(info));
console.log("LOGS:", JSON.stringify(logs.slice(0, 20)));
await browser.close();
