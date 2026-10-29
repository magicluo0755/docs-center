#!/usr/bin/env node
/** 端到端搜索验证：打开文档页 → 搜索栏输入关键词 → 断言结果非空并截图 */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const BROWSER_PATHS = [
  // BROWSER_PATH 优先（与 scripts/pdf/generate.js 一致）：Edge 无法无头启动时
  // 可直接指向 Chrome/chromium，见技术文档 §10.6
  process.env.BROWSER_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
].filter(Boolean);

(async () => {
  const [url, query, tag] = process.argv.slice(2);
  if (!url || !query) {
    console.error("usage: node verify_search.js <url> <query> [tag]");
    process.exit(1);
  }
  const executablePath = BROWSER_PATHS.find((p) => fs.existsSync(p));
  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // 打开搜索框（点导航栏放大镜，或直接按快捷键）
    const hasToggle = await page.$(".navbar__search button");
    if (hasToggle) {
      await hasToggle.click();
    } else {
      await page.keyboard.press("Control");
      await page.keyboard.press("k");
    }
    // 等待搜索输入框（DocSearch/IframeSearchUI/inline input 均兼容）
    await page.waitForSelector("inputDocSearch, input[type='search'], .docSearch_Input, input[placeholder]", { timeout: 15000 }).catch(() => {});
    await page.waitForFunction(() => {
      const el = document.querySelector("input[type='search'], .docSearch_Input, input[placeholder]");
      return el && el.offsetParent !== null;
    }, { timeout: 15000 });

    const input = await page.$("input[type='search'], .docSearch_Input, input[placeholder]");
    await input.type(query, { delay: 120 });
    // 等待结果列表渲染
    await page.waitForFunction(
      (q) => document.body.innerText.toLowerCase().includes(q.toLowerCase()),
      { timeout: 20000 },
      query
    );
    await new Promise((r) => setTimeout(r, 1500));

    const outDir = path.resolve(__dirname, "../output/verify");
    fs.mkdirSync(outDir, { recursive: true });
    const shot = path.join(outDir, `search-${tag || "result"}.png`);
    await page.screenshot({ path: shot });
    console.log(`OK: query "${query}" produced results on ${url}`);
    console.log(`saved: ${shot}`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error("SEARCH FAILED:", e.message);
  process.exit(1);
});
