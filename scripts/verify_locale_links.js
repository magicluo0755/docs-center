#!/usr/bin/env node
/**
 * 校验三语言互跳链路（构建产物级）。
 *
 * 语言下拉是 Docusaurus 原生 navbar item，链接由当前路径替换 locale 段生成，
 * 所以「切换后 404」只可能是产物里缺了对应语言的页面。本脚本对全站 HTML 里
 * 所有指向 /en/、/zh-Hant/ 的站内链接做落盘校验，并统计三个语言各自的页面数。
 *
 * 背景（2026-10-30）：`docusaurus start` 开发服务器一次只编译默认语言，
 * 开发态切到英文必然 404（见技术文档 §10.7）；多语言切换必须在生产产物上验证。
 *
 * 用法：node scripts/verify_locale_links.js [buildDir]
 */
const fs = require('fs');
const path = require('path');

const BUILD = process.argv[2] || 'build';
const LOCALES = ['en', 'zh-Hant'];

if (!fs.existsSync(BUILD)) {
  console.error(`✘ 构建目录不存在：${BUILD}`);
  process.exit(1);
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(p, out);
    } else if (e.name === 'index.html') {
      out.push(p);
    }
  }
  return out;
}

/** 判断链接落点是否命中真实产物（兼容目录 index 与 .html 两种形态） */
function exists(urlPath) {
  const rel = decodeURI(urlPath.replace(/^\//, ''));
  const target = path.join(BUILD, rel);
  return (
    fs.existsSync(path.join(target, 'index.html')) ||
    fs.existsSync(`${target}.html`) ||
    (fs.existsSync(target) && fs.statSync(target).isFile())
  );
}

const pages = walk(BUILD);
const problems = [];
const counts = {'zh-Hans': 0, en: 0, 'zh-Hant': 0};
let links = 0;
const seen = new Set();

for (const file of pages) {
  const rel = path.relative(BUILD, file).replace(/\\/g, '/');
  const lang = rel.startsWith('en/') ? 'en' : rel.startsWith('zh-Hant/') ? 'zh-Hant' : 'zh-Hans';
  counts[lang] += 1;

  const html = fs.readFileSync(file, 'utf8');
  const re = /href="(\/(?:en|zh-Hant)\/[^"#?]*)"/g;
  let m;
  while ((m = re.exec(html))) {
    links += 1;
    const href = m[1];
    if (!exists(href)) {
      const key = `${rel} -> ${href}`;
      if (!seen.has(key)) {
        seen.add(key);
        problems.push(key);
      }
    }
  }
}

// 首页 + 9 产品 + 2 版本 = 每语言至少 19 个入口页，缺语言会直接反映在计数上
console.log(
  `页面：zh-Hans ${counts['zh-Hans']} | en ${counts.en} | zh-Hant ${counts['zh-Hant']}`,
);
console.log(`跨语言链接：${links} 条`);

for (const loc of ['en', 'zh-Hant']) {
  if (counts[loc] === 0) {
    problems.push(`缺少 ${loc} 语言产物（是否只构建了默认语言？用 npm run build）`);
  }
}

if (problems.length) {
  console.log(`异常：${problems.length}`);
  for (const p of problems.slice(0, 10)) {
    console.log('  ✘ ' + p);
  }
  process.exit(1);
}
console.log('✔ 三语言产物齐备，语言切换链接全部可用');
