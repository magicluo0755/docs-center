const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
const EDGE_PATHS = [
  "C://Program Files (x86)//Microsoft//Edge//Application//msedge.exe",
  "C://Program Files//Microsoft//Edge//Application//msedge.exe",
];
(async () => {
  const url = process.argv[2];
  const query = process.argv[3];
  const browser = await puppeteer.launch({executablePath: EDGE_PATHS.find(p => fs.existsSync(p)), headless: "new", args: ["--no-sandbox", "--disable-gpu"]});
  const page = await browser.newPage();
  page.on("console", m => { const t = m.text(); if (/search|index|lunr|error/i.test(t)) console.log("[console]", t.slice(0, 200)); });
  page.on("pageerror", e => console.log("[pageerror]", String(e).slice(0, 300)));
  page.on("requestfailed", r => console.log("[reqfail]", r.url().slice(-80), r.failure()?.errorText));
  await page.setViewport({width: 1400, height: 900});
  await page.goto(url, {waitUntil: "networkidle2", timeout: 60000});
  const toggle = await page.$(".navbar__search button");
  if (toggle) await toggle.click(); else { await page.keyboard.press("Control"); await page.keyboard.press("k"); }
  await new Promise(r => setTimeout(r, 2000));
  const input = await page.$("input[type='search'], .docSearch_Input, input[placeholder]");
  console.log("input found:", !!input);
  if (input) {
    await input.type(query, {delay: 150});
    await new Promise(r => setTimeout(r, 4000));
    const txt = await page.evaluate(() => document.body.innerText.slice(0, 1500));
    console.log("---- innerText snippet ----");
    console.log(txt.slice(0, 800));
    await page.screenshot({path: "output/verify/debug-hant.png"});
  }
  await browser.close();
})();
