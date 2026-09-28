/** 多语言覆盖检测（真实场景：个别产品/版本可能仅有简体中文翻译）
 *  判定规则：i18n/<locale>/docusaurus-plugin-content-docs-<product>/{current|version-X.Y}/
 *  目录下（递归）存在 ≥1 个 .md 文件 → 该语言视为可用（部分翻译时缺页由站点回退渲染简体）；
 *  目录不存在或无 md → 视为缺失，PDF 出稿自动跳过该语言。
 *  zh-Hans 为源语言（products/<id>/docs/ 与 <id>_versioned_docs/），恒可用。 */
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..", "..");
const LANGS = ["zh-Hans", "zh-Hant", "en"];
const SOURCE_LANG = "zh-Hans";
const PRODUCTS = [
  "aas", "admq", "adc", "alb",
  "amdm", "adgp",
  "aig", "akm", "amem",
];

function i18nDocsRoot(productId, lang, version) {
  const sub = version === "current" ? "current" : `version-${version}`;
  return path.join(ROOT_DIR, "i18n", lang, `docusaurus-plugin-content-docs-${productId}`, sub);
}

function countMd(dir) {
  let n = 0;
  try {
    for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
      if (e.isDirectory()) n += countMd(path.join(dir, e.name));
      else if (/\.(md|mdx)$/.test(e.name)) n++;
    }
  } catch { /* 目录不存在 = 无翻译 */ }
  return n;
}

function hasTranslation(productId, version, lang) {
  if (lang === SOURCE_LANG) return true;
  return countMd(i18nDocsRoot(productId, lang, version)) > 0;
}

function availableLangs(productId, version) {
  return LANGS.filter((l) => hasTranslation(productId, version, l));
}

/** 回归期望值：全量合集 Σ(产品 × 可用语言 × 版本) + 分册 Σ(册数 × 可用语言 × 版本)。
 *  与 release-all.js 的跳过逻辑共用本模块，保证门禁与实际出稿口径一致。 */
function expectedPdfCount() {
  const MANUALS = (() => {
    const p = path.join(__dirname, "manuals.json");
    try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return {}; }
  })();
  let n = 0;
  for (const version of ["current", "1.0"]) {
    for (const product of PRODUCTS) {
      const langs = availableLangs(product, version).length;
      if (langs === 0) continue; // 防御：zh-Hans 恒可用，理论不可达
      n += langs; // 全量合集
      const e = MANUALS[product];
      if (e) {
        const list = (((e.versions || {})[version] || {}).manuals) || e.manuals || [];
        n += list.length * langs;
      }
    }
  }
  return n;
}

module.exports = {LANGS, SOURCE_LANG, PRODUCTS, hasTranslation, availableLangs, expectedPdfCount, i18nDocsRoot};
