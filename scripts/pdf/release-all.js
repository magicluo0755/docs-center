#!/usr/bin/env node
/** 发版全量 PDF 出稿：全部产品 × 全部语言 × 全部版本（模拟 CI pdf:release 任务）
 *  每个组合出：全量合集 1 份 + manuals.json 中该产品定义的分册 N 份
 *  （无分册配置的产品仅出全量，行为与历史版本一致） */
const {spawnSync} = require("child_process");
const path = require("path");
const fs = require("fs");
const {LANGS, PRODUCTS, availableLangs} = require("./lang-coverage");

const VERSIONS = ["current", "1.0"]; // current = V2.0；1.0 = 冻结版 V1.0

// 手册清单：产品级 manuals 生效于所有版本；versions[<version>].manuals 整体覆盖
const MANUALS = (() => {
  const p = path.join(__dirname, "manuals.json");
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return {}; }
})();
function manualsFor(product, version) {
  const e = MANUALS[product];
  if (!e) return [];
  return ((e.versions || {})[version] || {}).manuals || e.manuals || [];
}

let failed = 0;
let done = 0;
let skipped = 0;
function run(extraArgs, tag) {
  const r = spawnSync(
    process.execPath,
    [path.join(__dirname, "generate.js"),
     "--base", process.env.PDF_BASE || "http://localhost:3000",
     ...extraArgs],
    {stdio: "inherit"}
  );
  done++;
  if (r.status !== 0) {
    console.error(`FAILED: ${tag}`);
    failed++;
  }
}

for (const version of VERSIONS) {
  for (const product of PRODUCTS) {
    // 缺失翻译的语言整组跳过（与 generate.js 内的跳过检查同源判定）
    const langs = availableLangs(product, version);
    for (const lang of LANGS) {
      if (!langs.includes(lang)) {
        console.log(`SKIP ${product}/${version}/${lang}: 翻译缺失（i18n 目录无 md），不出稿`);
        skipped++;
        continue;
      }
      const common = ["--product", product, "--version", version, "--lang", lang];
      run(common, `${product}/${version}/${lang}/full`);
      for (const m of manualsFor(product, version)) {
        run([...common, "--manual", m.id], `${product}/${version}/${lang}/${m.id}`);
      }
    }
  }
}

console.log(failed === 0
  ? `\nAll ${done} PDFs generated successfully${skipped ? `，${skipped} 个组合因翻译缺失跳过` : ""}.`
  : `\n${failed}/${done} PDF generation(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
