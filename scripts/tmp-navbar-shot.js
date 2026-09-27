/* 临时脚本：截图导航栏（zh-Hans / en）用于 logo 标题验证 */
const path = require("path");
const puppeteer = require("puppeteer-core");

const EDGE_PATHS = [
  process.env.BROWSER_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

(async () => {
  const executablePath = EDGE_PATHS.find((p) => {
    try { require("fs").accessSync(p); return true; } catch { return false; }
  });
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  for (const [name, url] of [
    ["navbar-zh", "http://localhost:3000/"],
    ["navbar-en", "http://localhost:3000/en/"],
  ]) {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
    await page.waitForSelector("nav.navbar", { timeout: 15000 });
    const nav = await page.$("nav.navbar");
    await nav.screenshot({ path: path.join(__dirname, `${name}.png`) });
    console.log("saved", name);
  }
  await browser.close();
})();
