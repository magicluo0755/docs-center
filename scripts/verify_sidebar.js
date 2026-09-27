/**
 * 验证侧边栏头部（产品名+版本下拉）与移动端抽屉：
 * 1. 桌面端：检查侧边栏头部渲染、点击版本下拉截图、断言"当前阅读"上下文条已移除
 * 2. 移动端：打开汉堡抽屉，截图抽屉内的产品头部
 * 用法: node scripts/verify_sidebar.js <url> <outPrefix>
 */
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer-core");

const EDGE_CANDIDATES = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
];

(async () => {
  const [url, outPrefix] = process.argv.slice(2);
  if (!url || !outPrefix) {
    console.error("usage: node verify_sidebar.js <url> <outPrefix>");
    process.exit(1);
  }
  const executablePath = EDGE_CANDIDATES.find((p) => fs.existsSync(p));
  if (!executablePath) throw new Error("Edge not found");
  const outDir = path.resolve(__dirname, "../output/verify");
  fs.mkdirSync(outDir, {recursive: true});

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({width: 1400, height: 900});
    await page.goto(url, {waitUntil: "networkidle0", timeout: 60000});
    await page.waitForSelector(".sidebar-product-header", {timeout: 15000}).catch(() => {});

    const header = await page
      .$eval(".sidebar-product-header", (el) => el.textContent.trim().replace(/\s+/g, " "))
      .catch(() => "(未渲染)");
    const breadcrumb = await page
      .$eval(".breadcrumbs", (el) => el.textContent.trim().replace(/\s+/g, " "))
      .catch(() => "(无面包屑)");
    const oldBar = await page.$(".product-context-bar");
    console.log("sidebar-header:", header);
    console.log("breadcrumb:", breadcrumb);
    console.log("old-context-bar:", oldBar ? "仍存在(异常)" : "已移除 ✓");
    await page.screenshot({path: path.join(outDir, `${outPrefix}-desktop.png`)});

    // 展开侧边栏版本下拉
    await page.click(".sidebar-product-header .navbar__link").catch(() => {});
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({path: path.join(outDir, `${outPrefix}-version-open.png`)});

    // 移动端抽屉
    await page.setViewport({width: 390, height: 844});
    await page.reload({waitUntil: "networkidle0"});
    await page.click(".navbar__item.navbar__toggle-clean, button.navbar__toggle").catch(() => {});
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({path: path.join(outDir, `${outPrefix}-mobile-drawer.png`)});
    const mobileHeader = await page
      .$eval(".sidebar-product-header", (el) => el.textContent.trim().replace(/\s+/g, " "))
      .catch(() => "(未渲染)");
    console.log("mobile-drawer-header:", mobileHeader);
    console.log("saved:", outPrefix + "-*.png");
  } finally {
    await browser.close();
  }
})();
