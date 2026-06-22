import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:5173/", { waitUntil: "load" });
await page.waitForTimeout(2000);

const report = await page.evaluate(() => {
  const ids = ["work", "about", "clients", "awards", "contact"];
  const out = {};
  for (const id of ids) {
    const el = document.getElementById(id);
    out[id] = el ? Math.round(el.getBoundingClientRect().height) : "MISSING";
  }
  out.nav = !!document.querySelector(".nav");
  out.footer = !!document.querySelector(".footer");
  out.canvas = !!document.querySelector(".living__canvas");
  out.workItems = document.querySelectorAll(".work-list__item").length;
  out.workCards = document.querySelectorAll(".work-card").length;
  out.awards = document.querySelectorAll(".awards__item").length;
  out.bodyHeight = Math.round(document.body.scrollHeight);
  return out;
});

console.log(JSON.stringify(report, null, 2));
await browser.close();
