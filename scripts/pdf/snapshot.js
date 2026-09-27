#!/usr/bin/env node
/**
 * PDF 质量验证辅助：聚合 HTML → Paged.js 分页 → 截图前 N 页（封面/目录/正文）
 * 用法：node scripts/pdf/snapshot.js --product aas --version current --lang zh-Hans --pages 3
 */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
const { fetchSections, buildHtml } = require("./generate.js");

const args = process.argv.slice(2);
function arg(name, def) {
  const i = args.indexOf("--" + name);
  return i >= 0 ? args[i + 1] : def;
}
const PRODUCT = arg("product", "aas");
const VERSION = arg("version", "current");
const LANG = arg("lang", "zh-Hans");
const NPAGES = parseInt(arg("pages", "3"), 10);
const PAGEDJS_PATH = path.join(
  __dirname, "..", "..", "node_modules", "pagedjs", "dist", "paged.polyfill.min.js");
const EDGE_PATHS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

(async () => {
  const sections = await fetchSections();
  const html = buildHtml(sections);
  const tmpHtml = path.resolve(__dirname, `.tmp-snap-${PRODUCT}-${LANG}.html`);
  fs.writeFileSync(tmpHtml, html, "utf8");

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATHS.find((p) => fs.existsSync(p)),
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 1273 });
  await page.goto("file:///" + tmpHtml.replace(/\\/g, "/"), { waitUntil: "networkidle0" });
  await page.waitForFunction(
    () => window.PagedPolyfill && document.querySelector(".pagedjs_page"),
    { timeout: 120000 }
  );
  await new Promise((r) => setTimeout(r, 1500));

  const shotDir = path.resolve(__dirname, "../../output/pdf/_snapshots");
  fs.mkdirSync(shotDir, { recursive: true });
  for (let i = 1; i <= NPAGES; i++) {
    const el = await page.$(`.pagedjs_page:nth-of-type(${i})`);
    if (!el) break;
    const file = path.join(shotDir, `${PRODUCT}-${VERSION}-${LANG}-p${i}.png`);
    await el.screenshot({ path: file });
    console.log("saved:", file);
  }
  await browser.close();
  fs.unlinkSync(tmpHtml);
})().catch((e) => { console.error(e.message); process.exit(1); });
