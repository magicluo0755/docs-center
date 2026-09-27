#!/usr/bin/env node
/**
 * Apusic 文档中心 — PDF 自动化出稿脚本（原型实现）
 *
 * 管线：构建产物站点页面 → 提取正文 → 聚合（封面 + 法律声明页 + 自动目录 + 章节）→
 *       Paged.js 分页（自动目录回填页码、页眉页脚）→ 无头 Chromium 输出 PDF（含书签 outline）
 *
 * 封面/声明页定制：
 *   - scripts/pdf/cover.config.json  公司名、logo、副标题、密级等全局配置
 *   - scripts/pdf/notice.<lang>.html 版权/法律声明页模板（占位符渲染）
 *   - CLI 覆盖：--doc-title "安装手册" --logo static/img/logo.svg --date 2026-09-25
 *
 * 用法：
 *   node scripts/pdf/generate.js --product aas --version current --lang zh-Hans
 *   node scripts/pdf/generate.js --product aig --version 1.0 --lang en
 *
 * 依赖：站点已构建（npm run build）并启动预览（npm run serve 或 npx docusaurus serve）
 */
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer-core");

// ─── 参数解析 ───────────────────────────────────────────────
const args = process.argv.slice(2);
function arg(name, def) {
  const i = args.indexOf("--" + name);
  return i >= 0 ? args[i + 1] : def;
}
const PRODUCT = arg("product", "aas");
const VERSION = arg("version", "current"); // current = V2.0；1.0 = 冻结版
const LANG = arg("lang", "zh-Hans");
const BASE = arg("base", "http://localhost:3000");
const OUT = arg("out");
// 封面/前置页可定制参数：CLI > cover.config.json > 内置默认
const DOC_TITLE = arg("doc-title");          // 文档名，如 "安装手册"
const LOGO_OVERRIDE = arg("logo");           // logo 路径（相对 docs-center 根目录）
const DATE_OVERRIDE = arg("date");           // 发布日期，如 2026-09-25
const COVER_CONFIG = (() => {
  const p = path.join(__dirname, "cover.config.json");
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : {};
})();

const DOCS = [
  ["intro", { zh: "产品简介", hant: "產品簡介", en: "Introduction" }],
  ["quick-start", { zh: "快速开始", hant: "快速開始", en: "Quick Start" }],
  ["installation", { zh: "安装手册", hant: "安裝手冊", en: "Installation Guide" }],
  ["usage", { zh: "使用手册", hant: "使用手冊", en: "User Guide" }],
  ["configuration", { zh: "配置手册", hant: "配置手冊", en: "Configuration Guide" }],
  ["development", { zh: "开发手册", hant: "開發手冊", en: "Developer Guide" }],
  ["performance", { zh: "性能调优", hant: "性能調優", en: "Performance Tuning" }],
];

// 语言键：cover.config.json / DOCS / PRODUCT_NAMES 中按此键取文案
const LANG_KEY =
  LANG === "zh-Hans" ? "zh" : LANG === "zh-Hant" ? "hant" : "en";

const PAGEDJS_PATH = path.join(
  __dirname,
  "..",
  "..",
  "node_modules",
  "pagedjs",
  "dist",
  "paged.polyfill.min.js"
);
if (!fs.existsSync(PAGEDJS_PATH)) {
  throw new Error("pagedjs dist not found: " + PAGEDJS_PATH);
}
const EDGE_PATHS = [
  // 显式指定优先（CI：apt 装 chromium 或 msedge 后 export BROWSER_PATH=...）
  process.env.BROWSER_PATH,
  process.env.CHROME_PATH,
  // Windows：Edge
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  // Linux：Edge / Chromium / Chrome
  "/usr/bin/microsoft-edge",
  "/usr/bin/microsoft-edge-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  // macOS：Edge / Chrome
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

function pageUrl(doc) {
  const seg = [LANG === "zh-Hans" ? "" : "/" + LANG, "/" + PRODUCT];
  if (VERSION !== "current") seg.push("/" + VERSION);
  return BASE + seg.join("") + "/" + doc;
}

// ─── 章节序号（需求 4.10：PDF 章节编号）─────────────────────
// 中文一级标题：「第一章 标题」（全章名与标题间一个空格）
// 英文一级标题：「CHAPTER 1.标题」（序号与标题间无空格，按用户指定；如需 Red Hat 标准空格，改 CHAPTER_SEP 为 " "）
// 子标题（中英一致）：「2.1.」「2.3.1.」层级小数序号，序号后直接接标题、无分隔符
const CHAPTER_SEP_EN = "";
function zhChapterNum(n) {
  const d = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  if (n < 10) return d[n];
  if (n === 10) return "十";
  if (n < 20) return "十" + d[n % 10];
  return d[Math.floor(n / 10)] + "十" + (n % 10 ? d[n % 10] : "");
}
function h1Prefix(n) {
  return LANG.startsWith("zh")
    ? `第${zhChapterNum(n)}章 `
    : `CHAPTER ${n}.${CHAPTER_SEP_EN}`;
}
function subPrefix(chap, h2, h3) {
  return h3 === undefined ? `${chap}.${h2}.` : `${chap}.${h2}.${h3}.`;
}

// ─── 抓取并聚合各文档页面 ───────────────────────────────────
async function fetchSections() {
  const sections = [];
  let chapterCounter = 0; // 全文档章计数（每个文档一章，多 h1 时顺延）
  for (const [doc, titles] of DOCS) {
    const url = pageUrl(doc);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    const article = $("article");
    if (!article.length) throw new Error(`No <article> found on ${url}`);

    // 标题：优先 og:title（截掉 " | 站点名" 后缀）
    const ogTitle = $("meta[property='og:title']").attr("content") || "";
    const title =
      ogTitle.split(/[|｜]/)[0].trim() || titles[LANG_KEY] || doc;

    // 提取正文主体（去掉分页导航、面包屑、版本徽标、浮动目录等）
    const body = article.clone();
    body
      .find(
        ".theme-doc-footer, .pagination-nav, .tocCollapsible, .breadcrumbs, " +
          ".theme-doc-version-badge, .theme-doc-toc-mobile"
      )
      .remove();

    // 各文档标题 id 加前缀，避免跨文档锚点冲突；同时注入章节序号（4.10）
    const secId = `sec-${sections.length}`;
    let sub = [];
    let chap = 0;
    let h2n = 0;
    let h3n = 0;
    let chapPrefix = "";
    body.find("h1, h2, h3").each((_, el) => {
      const node = $(el);
      const oldId = node.attr("id");
      const newId = `${secId}-${oldId || node.text().trim()}`;
      node.attr("id", newId);
      if (el.tagName === "h1") {
        chapterCounter++;
        chap = chapterCounter;
        h2n = 0;
        h3n = 0;
        chapPrefix = h1Prefix(chap);
        node.prepend(chapPrefix);
      } else if (el.tagName === "h2") {
        h2n++;
        h3n = 0;
        node.prepend(subPrefix(chap, h2n));
      } else {
        h3n++;
        node.prepend(subPrefix(chap, h2n, h3n));
      }
      if (el.tagName === "h2") {
        sub.push({ id: newId, text: node.text().replace(/\u200b/g, "").trim() });
      }
    });

    sections.push({
      id: secId,
      title,
      chapterPrefix: h1Prefix(chapterCounter),
      anchor: `${secId}-${(body.find("h1").attr("id") || "").split("-").slice(1).join("-")}`,
      h1Id: body.find("h1").attr("id"),
      subs: sub,
      html: body.html(),
      url,
    });
  }
  return sections;
}

// ─── 封面与前置页（版式参考 Red Hat 文档：白底居中，参数可定制）───
const PRODUCT_NAMES = {
  aas: { zh: "金蝶Apusic应用服务器", hant: "金蝶Apusic應用服務器", en: "Apusic Application Server" },
  admq: { zh: "金蝶Apusic分布式消息队列", hant: "金蝶Apusic分佈式消息隊列", en: "Apusic Distributed Message Queue" },
  adc: { zh: "金蝶Apusic分布式缓存", hant: "金蝶Apusic分佈式緩存", en: "Apusic Memory Data in Cache" },
  alb: { zh: "金蝶Apusic负载均衡器", hant: "金蝶Apusic負載均衡器", en: "Apusic Load Balancer" },
  amdm: { zh: "金蝶Apusic主数据管理", hant: "金蝶Apusic主數據管理", en: "Apusic Master Data Management" },
  adgp: { zh: "金蝶Apusic数据治理平台", hant: "金蝶Apusic數據治理平臺", en: "Apusic Data Governance Platform" },
  aig: { zh: "金蝶Apusic AI 网关", hant: "金蝶Apusic AI 網關", en: "Apusic AI Gateway" },
  akm: { zh: "金蝶Apusic知识库平台", hant: "金蝶Apusic知識庫平臺", en: "Apusic Knowledge Management" },
  amem: { zh: "金蝶Apusic记忆平台", hant: "金蝶Apusic記憶平臺", en: "Apusic Memory Platform" },
};

const cfg = (key) => (COVER_CONFIG[key] || {})[LANG] ?? "";
const verLabel = () => (VERSION === "current" ? "V2.0" : "V1.0");
const releaseDate = () =>
  DATE_OVERRIDE || new Date().toISOString().slice(0, 10);
const logoAbsPath = () =>
  path.resolve(__dirname, "..", "..", LOGO_OVERRIDE || COVER_CONFIG.logo || "static/img/logo-horizontal.svg");

function manualTitle() {
  if (DOC_TITLE) return DOC_TITLE;
  return LANG_KEY === "en" ? "Product Documentation" : LANG_KEY === "hant" ? "產品文檔手冊" : "产品文档手册";
}

function coverHtml() {
  const name = (PRODUCT_NAMES[PRODUCT] || {})[LANG_KEY] || PRODUCT;
  const date = releaseDate();
  const cls = COVER_CONFIG.showClassification === false ? "" : `
      <p class="cover-class">${cfg("classification")}</p>`;
  return `
  <section class="cover" id="cover">
    <div class="cover-inner">
      <img class="cover-logo" src="file:///${logoAbsPath().replace(/\\/g, "/")}" alt="logo">
      <p class="cover-product">${name} <span class="cover-version-inline">${verLabel()}</span></p>
      <div class="cover-doctitle">${manualTitle()}</div>
      ${cfg("subtitle") ? `<p class="cover-sub">${cfg("subtitle")}</p>` : ""}
    </div>
    <div class="cover-footer">
      ${cls}
      <p class="cover-date">${cfg("dateLabel")}: ${date}</p>
    </div>
  </section>`;
}

// ─── 公共前置页（版权/法律声明）：独立模板文件，插在封面后、目录前 ───
function noticeHtml() {
  const tplPath = path.join(__dirname, `notice.${LANG}.html`);
  if (!fs.existsSync(tplPath)) return ""; // 缺模板时静默跳过
  const ph = {
    COMPANY: cfg("company") || "Apusic",
    PRODUCT: (PRODUCT_NAMES[PRODUCT] || {})[LANG_KEY] || PRODUCT.toUpperCase(),
    VERSION: verLabel(),
    MANUAL: manualTitle(),
    DATE: releaseDate(),
    YEAR: new Date().getFullYear(),
    CLASSIFICATION: cfg("classification"),
  };
  let tpl = fs.readFileSync(tplPath, "utf8");
  for (const [k, v] of Object.entries(ph)) {
    tpl = tpl.split("{{" + k + "}}").join(v);
  }
  return tpl;
}

// ─── 组装单文档 HTML ────────────────────────────────────────
function buildHtml(sections) {
  const tocItems = sections
    .map(
      (s) => `
      <li class="toc-l1"><a href="#${s.h1Id}"><span class="toc-title">${s.chapterPrefix}${s.title}</span><span class="toc-dots"></span></a>
        ${
          s.subs.length
            ? `<ul>${s.subs
                .map((t) => `<li class="toc-l2"><a href="#${t.id}"><span class="toc-title">${t.text}</span><span class="toc-dots"></span></a></li>`)
                .join("")}</ul>`
            : ""
        }
      </li>`
    )
    .join("");

  const body = sections
    .map((s) => `<section class="chapter">${s.html}</section>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="${LANG}">
<head>
<meta charset="utf-8">
<title>${(PRODUCT_NAMES[PRODUCT] || {})[LANG_KEY] || PRODUCT} ${verLabel()} ${manualTitle()}</title>
<style>
  :root { --brand: #2e5fd8; }
  body {
    font-family: "Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif;
    font-size: 10.5pt; line-height: 1.75; color: #1c1e21; margin: 0;
  }
  h1 { font-size: 20pt; color: var(--brand); border-bottom: 2px solid var(--brand); padding-bottom: 6px; }
  h2 { font-size: 14pt; color: #222; margin-top: 1.6em; }
  h3 { font-size: 12pt; }
  table { border-collapse: collapse; width: 100%; margin: 0.8em 0; font-size: 9.5pt; }
  th, td { border: 1px solid #c9cdd4; padding: 5px 9px; text-align: left; }
  th { background: #eef2fb; }
  pre { background: #f5f7fa; border: 1px solid #dde3ea; border-radius: 4px; padding: 10px 12px;
        font-size: 8.5pt; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word; }
  code { font-family: Consolas, "Courier New", monospace; }
  :not(pre) > code { background: #eef1f5; padding: 1px 5px; border-radius: 3px; font-size: 9pt; }
  blockquote, .admonition, .theme-admonition {
    border-left: 4px solid var(--brand); background: #f0f4fd;
    margin: 1em 0; padding: 8px 14px; border-radius: 0 4px 4px 0;
  }
  .admonition-title, [class^="admonitionHeading"], [class*=" admonitionHeading"] { font-weight: 700; }
  /* admonition 图标：SVG 仅带 viewBox（无宽高），脱离站点 CSS 后会被撑满整页，显式约束为行内小图标 */
  .theme-admonition svg, span[class^="admonitionIcon"] svg, div[class^="admonitionIcon"] svg {
    width: 1.15em; height: 1.15em;
  }
  span[class^="admonitionIcon"], div[class^="admonitionIcon"] {
    display: inline-block; vertical-align: -0.125em; margin-right: 0.4em;
  }
  .admonition-warning, .theme-admonition-warning { border-left-color: #d97706; background: #fdf6ec; }
  .admonition-danger, .theme-admonition-danger  { border-left-color: #dc2626; background: #fdf0ef; }
  a { color: inherit; text-decoration: none; }
  img { max-width: 100%; }

  /* ── Paged.js 分页规则 ── */
  /* 页眉：章节标题左对齐；页脚：页码左对齐 + 品牌右对齐。
     分隔横线用 @page background 定位绘制（Paged.js 对 top margin box 的 border 支持不稳定），
     线位置：页眉线 21.5mm（内容区上界 22mm 上方 0.5mm），页脚线 277.5mm（内容区下界 277mm 下方 0.5mm） */
  @page {
    size: A4;
    margin: 22mm 18mm 20mm 18mm;
    background-image: linear-gradient(to right, #b9b9b9, #b9b9b9), linear-gradient(to right, #b9b9b9, #b9b9b9);
    background-size: 174mm 0.35mm, 174mm 0.35mm;
    background-position: 18mm 21.3mm, 18mm 277.6mm;
    background-repeat: no-repeat, no-repeat;
    @top-left { content: string(chaptitle); font-size: 8pt; color: #666; vertical-align: bottom; }
    @bottom-left { content: counter(page); font-size: 9pt; color: #555; vertical-align: top; }
  }
  @page cover {
    margin: 0;
    background-image: none;
    @top-left { content: none; } @top-center { content: none; } @top-right { content: none; }
    @bottom-left { content: none; } @bottom-center { content: none; } @bottom-right { content: none; }
  }
  @page toc { @top-left { content: none; } @top-center { content: none; } @top-right { content: none; } }

  /* ── 封面（参考 Red Hat 文档版式：白底、居中 logo + 标题组、右下日期）── */
  .cover { page: cover; height: 297mm; width: 210mm; position: relative; background: #fff; }
  .cover-inner { position: absolute; top: 52mm; left: 20mm; right: 20mm; text-align: center; }
  /* 官方横式图文组合 logo（宽高比约 4.6:1），84mm 宽与 26pt 产品名形成协调的视觉量级 */
  .cover-logo { width: 84mm; height: auto; margin-bottom: 20mm; }
  .cover-product { font-size: 26pt; font-weight: 400; color: #1c1e21; margin: 0 0 12mm; }
  /* 版本号与产品名同字号同色，视觉一体 */
  .cover-version-inline { font-size: 26pt; color: #1c1e21; white-space: nowrap; }
  .cover-doctitle { font-size: 26pt; font-weight: 400; color: #1c1e21; margin-bottom: 6mm; }
  .cover-sub { font-size: 11pt; color: #57606a; margin: 0; }
  .cover-footer { position: absolute; bottom: 16mm; left: 20mm; right: 20mm; text-align: right; }
  .cover-class { font-size: 9pt; color: #8b949e; margin: 0 0 2mm; }
  .cover-date { font-size: 10pt; color: #57606a; margin: 0; }

  /* ── 公共前置页（版权/法律声明）── */
  .notice { page-break-before: always; page-break-after: always; }
  .notice h1 { border: none; margin-bottom: 1.2em; }
  .notice h2 { font-size: 13pt; margin-top: 1.5em; }
  .notice-meta { width: 82%; font-size: 10pt; }
  .notice-meta th { width: 30mm; background: #f0f3f9; color: #444; }

  /* ── 目录（自动页码）── */
  .toc { page: toc; page-break-before: always; page-break-after: always; }
  .toc h1 { border: none; margin-bottom: 1.2em; }
  .toc ul { list-style: none; padding-left: 0; }
  .toc li.toc-l1 { margin: 0.55em 0; font-size: 11pt; font-weight: 700; }
  .toc li.toc-l2 { font-size: 9.5pt; font-weight: 400; margin: 0.28em 0 0.28em 1.6em; }
  /* 目录：标题 ……虚线…… 页码（省略号点串，传统 docx 目录样式） */
  .toc a {
    display: flex;
    align-items: baseline;
    color: inherit;
  }
  /* 弹性占位 + 溢出裁切：用重复点串填充标题与页码之间的空隙 */
  .toc .toc-dots {
    flex: 1;
    min-width: 2em;
    overflow: hidden;
    margin: 0 0.45em;
    white-space: nowrap;
    color: #9aa4ad;
  }
  .toc .toc-dots::before {
    content: ". . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .";
  }
  .toc a::after { content: target-counter(attr(href url), page); color: #666; font-weight: 400; }

  /* ── 章节 ── */
  .chapter { page-break-before: always; }
  .chapter h1 { string-set: chaptitle content(); }
</style>
</head>
<body>
  ${coverHtml()}
  ${noticeHtml()}
  <section class="toc">
    <h1>${LANG_KEY === "en" ? "Table of Contents" : LANG_KEY === "hant" ? "目 錄" : "目 录"}</h1>
    <ul>${tocItems}</ul>
  </section>
  ${body}
  <script src="file:///${PAGEDJS_PATH.replace(/\\/g, "/")}"></script>
</body>
</html>`;
}

// ─── 无头浏览器渲染并输出 PDF ───────────────────────────────
async function renderPdf(htmlPath, pdfPath) {
  const executablePath = EDGE_PATHS.find((p) => fs.existsSync(p));
  if (!executablePath)
    throw new Error(
      "No Chromium-based browser found (set BROWSER_PATH env to override)"
    );

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--font-render-hinting=none"],
  });
  try {
    const page = await browser.newPage();
    await page.goto("file:///" + htmlPath.replace(/\\/g, "/"), {
      waitUntil: "networkidle0",
      timeout: 120000,
    });
    // 等待 Paged.js 分页完成
    await page.waitForFunction(
      () => window.PagedPolyfill && document.querySelector(".pagedjs_pages"),
      { timeout: 120000 }
    );
    await page.evaluate(() => new Promise((resolve) => {
      if (document.querySelector(".pagedjs_page")) return resolve();
      window.addEventListener("pagedjs:rendered", resolve);
      setTimeout(resolve, 60000); // 兜底
    }));
    await new Promise((r) => setTimeout(r, 800));
    // 先写临时文件再原子替换：目标 PDF 可能正被阅读器/预览占用（EBUSY）
    const tmpPdf = pdfPath.replace(/\.pdf$/i, `.tmp-${process.pid}.pdf`);
    await page.pdf({
      path: tmpPdf,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      // 按文档标题层级（h1/h2/h3）自动生成 PDF 书签（outline），点击跳转章节
      outline: true,
    });
    for (let attempt = 1; ; attempt++) {
      try {
        fs.renameSync(tmpPdf, pdfPath);
        break;
      } catch (e) {
        if (e.code !== "EBUSY" && e.code !== "EPERM") throw e;
        if (attempt >= 5) {
          // 目标仍被占用：依次尝试 -updated.pdf、时间戳兜底名，绝不静默丢稿
          const candidates = [
            pdfPath.replace(/\.pdf$/i, "-updated.pdf"),
            pdfPath.replace(/\.pdf$/i, `-updated-${Date.now()}.pdf`),
          ];
          let saved = null;
          for (const fallback of candidates) {
            try {
              fs.renameSync(tmpPdf, fallback);
              saved = fallback;
              break;
            } catch (e2) {
              if (e2.code !== "EBUSY" && e2.code !== "EPERM") throw e2;
            }
          }
          if (!saved) throw e;
          console.warn(`WARN: ${pdfPath} is locked, saved as ${saved}`);
          break;
        }
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  } finally {
    await browser.close();
  }
}

module.exports = { fetchSections, buildHtml, renderPdf, pageUrl };

if (require.main === module) {
  (async () => {
    console.log(`[1/4] Fetching ${DOCS.length} pages for ${PRODUCT}/${VERSION}/${LANG} ...`);
    const sections = await fetchSections();
    console.log(`      OK: ${sections.map((s) => s.title).join(" | ")}`);

    console.log("[2/4] Assembling HTML (cover + TOC + chapters) ...");
    const html = buildHtml(sections);
    const tmpHtml = path.resolve(__dirname, `.tmp-${PRODUCT}-${VERSION}-${LANG}.html`);
    fs.writeFileSync(tmpHtml, html, "utf8");

    console.log("[3/4] Rendering with Paged.js via headless Chromium ...");
    const ver = VERSION === "current" ? "V2.0" : "V1.0";
    const outDir = path.resolve(__dirname, "../../output/pdf", PRODUCT, ver, LANG);
    fs.mkdirSync(outDir, { recursive: true });
    const pdfPath = path.join(outDir, `${PRODUCT}-${ver}-${LANG}.pdf`);
    await renderPdf(tmpHtml, pdfPath);

    try {
      fs.unlinkSync(tmpHtml);
    } catch {
      // 临时 HTML 清理失败（如被占用/删除保护拦截）不影响交付，仅提示
      console.warn(`WARN: temp html not removed: ${tmpHtml}`);
    }
    const size = (fs.statSync(pdfPath).size / 1024).toFixed(0);
    console.log(`[4/4] Done: ${pdfPath} (${size} KB)`);
  })().catch((e) => {
    console.error("PDF generation failed:", e.message);
    process.exit(1);
  });
}
