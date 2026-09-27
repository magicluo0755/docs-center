#!/usr/bin/env node
/** 导航栏下拉功能验证：打开产品文档页 → 截图导航栏 → 展开版本/语言下拉再截图 */
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer-core");

const EDGE_PATHS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const URL = process.argv[2] || "http://localhost:3000/aas/intro";
const OUTDIR = path.resolve(__dirname, "../output/verify");
fs.mkdirSync(OUTDIR, { recursive: true });

async function main() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATHS.find((p) => fs.existsSync(p)),
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 500 });
  await page.goto(URL, { waitUntil: "networkidle0", timeout: 60000 });

  const shot = (name) =>
    page.screenshot({ path: path.join(OUTDIR, name), clip: { x: 0, y: 0, width: 1400, height: 320 } });

  await page.waitForSelector(".navbar", { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 800));
  await shot("navbar-default.png");

  // 展开「版本」下拉（按钮文本为当前版本号 V2.0 / V1.0）
  const versionBtn = await page.$$(".navbar__item.dropdown");
  let clickedVersion = false;
  for (const el of versionBtn) {
    const text = await page.evaluate((n) => n.textContent.trim(), el);
    if (/^V\d\.\d/.test(text) && text.length < 30) {
      await el.click();
      clickedVersion = true;
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 600));
  if (clickedVersion) await shot("navbar-version-open.png");
  console.log("version dropdown clicked:", clickedVersion);

  // 展开语言下拉
  const localeBtn = await page.$(".navbar__item.dropdown .navbar__link[aria-label='Languages'], .dropdown--locale");
  const items = await page.$$(".navbar__item.dropdown");
  let clickedLocale = false;
  for (const el of items) {
    const text = await page.evaluate((n) => n.textContent.trim(), el);
    if (/简体中文|English|Languages/.test(text) && text.length < 20) {
      await el.click();
      clickedLocale = true;
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 600));
  if (clickedLocale) await shot("navbar-locale-open.png");
  console.log("locale dropdown clicked:", clickedLocale);

  await browser.close();
}
main().catch((e) => { console.error(e.message); process.exit(1); });
