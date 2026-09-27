#!/usr/bin/env node
/** 发版全量 PDF 出稿：全部产品 × 全部语言 × 全部版本（模拟 CI pdf:release 任务） */
const {spawnSync} = require("child_process");
const path = require("path");

const PRODUCTS = [
  "aas", "admq", "adc", "alb",
  "amdm", "adgp",
  "aig", "akm", "amem",
];
const LANGS = ["zh-Hans", "zh-Hant", "en"];
const VERSIONS = ["current", "1.0"]; // current = V2.0；1.0 = 冻结版 V1.0

let failed = 0;
let done = 0;
for (const version of VERSIONS) {
  for (const product of PRODUCTS) {
    for (const lang of LANGS) {
      const r = spawnSync(
        process.execPath,
        [path.join(__dirname, "generate.js"), "--product", product, "--version", version, "--lang", lang, "--base", process.env.PDF_BASE || "http://localhost:3000"],
        {stdio: "inherit"}
      );
      done++;
      if (r.status !== 0) {
        console.error(`FAILED: ${product}/${version}/${lang}`);
        failed++;
      }
    }
  }
}

console.log(failed === 0
  ? `\nAll ${done} PDFs generated successfully.`
  : `\n${failed}/${done} PDF generation(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
