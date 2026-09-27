/**
 * 截取文档页顶部区域（导航栏 + 产品上下文条 + 正文标题），用于视觉验证。
 * 用法: node scripts/screenshot_page.js <url> <outfile>
 */
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer-core");

const EDGE_CANDIDATES = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
];

(async () => {
  const [url, out] = process.argv.slice(2);
  if (!url || !out) {
    console.error("usage: node screenshot_page.js <url> <outfile>");
    process.exit(1);
  }
  const executablePath = EDGE_CANDIDATES.find((p) => fs.existsSync(p));
  if (!executablePath) throw new Error("Edge not found");

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({width: 1400, height: 560});
    await page.goto(url, {waitUntil: "networkidle0", timeout: 60000});
    // 确保产品上下文条已水合渲染
    await page.waitForSelector(".product-context-bar", {timeout: 15000}).catch(() => {});
    await new Promise((r) => setTimeout(r, 800));
    fs.mkdirSync(path.dirname(out), {recursive: true});
    await page.screenshot({path: out});
    const barText = await page
      .$eval(".product-context-bar", (el) => el.textContent.trim().replace(/\s+/g, " "))
      .catch(() => "(未渲染)");
    const navName = await page
      .$eval(".navbar-product-name", (el) => el.textContent.trim())
      .catch(() => "(未渲染)");
    console.log("context-bar:", barText);
    console.log("navbar-product-name:", navName);
    console.log("saved:", out);
  } finally {
    await browser.close();
  }
})();
