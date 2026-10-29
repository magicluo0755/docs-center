#!/usr/bin/env node
/**
 * 校验文档页脚动作行（构建产物级）：原生「编辑此页」+「下载 PDF」。
 *
 * 编辑链接由 docs 插件的 editUrl 生成（不是自建映射表），所以这里重点守两件事：
 *   1. 链接落点确实是仓库里存在的文件（多实例 / 冻结版 / i18n 三套目录都覆盖）；
 *   2. 两个动作留在 <footer> 内、每页各一个（防止误挂到导航栏或重复渲染）。
 *
 * 用法：node scripts/verify_doc_actions.js [buildDir]
 */
const fs = require('fs');
const path = require('path');

const BUILD = process.argv[2] || 'build';
const REPO_EDIT = 'https://github.com/magicluo0755/docs-center/edit/main/';

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

if (!fs.existsSync(BUILD)) {
  console.error(`✘ 构建目录不存在：${BUILD}`);
  process.exit(1);
}

const pages = walk(BUILD);
let docPages = 0;
let pdfLinks = 0;
let editLinks = 0;
const problems = [];

for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const artStart = html.indexOf('<article');
  if (artStart === -1) {
    continue;
  }
  docPages++;
  const rel = path.relative(BUILD, file).replace(/\\/g, '/');
  const artEnd = html.indexOf('</article>', artStart);
  const footerStart = html.indexOf('<footer', artStart);
  const footerEnd = footerStart === -1 ? -1 : html.indexOf('</footer>', footerStart);

  // ── 编辑链接：每页恰好一个，且在页脚内、指向真实存在的源文件
  const edits = [...html.matchAll(/href="https:\/\/github\.com\/magicluo0755\/docs-center\/edit\/main\/([^"]+)"/g)];
  if (edits.length !== 1) {
    problems.push(`[${rel}] 编辑链接数量为 ${edits.length}（应为 1）`);
  } else {
    editLinks++;
    const idx = edits[0].index;
    if (footerStart === -1 || idx < footerStart || idx > footerEnd) {
      problems.push(`[${rel}] 编辑链接不在文档页脚内`);
    }
    const src = decodeURIComponent(edits[0][1]);
    if (!fs.existsSync(path.join(process.cwd(), src))) {
      problems.push(`[${rel}] 编辑链接指向不存在的文件：${src}`);
    }
  }

  // ── PDF 链接：每页恰好一个，页脚内，目标文件真实存在且无 locale 前缀污染
  const pdfs = [...html.matchAll(/href="([^"]*\/downloads\/pdf\/[^"]*)"[^>]*data-pdf-file="([^"]*)"/g)];
  if (pdfs.length !== 1) {
    problems.push(`[${rel}] PDF 链接数量为 ${pdfs.length}（应为 1）`);
  } else {
    pdfLinks++;
    const [m, href, fileName] = pdfs[0];
    const idx = html.indexOf(m);
    if (footerStart === -1 || idx < footerStart || idx > footerEnd) {
      problems.push(`[${rel}] PDF 链接不在文档页脚内`);
    }
    if (/^\/(en|zh-Hant)\/downloads\//.test(href)) {
      problems.push(`[${rel}] PDF 链接带 locale 前缀：${href}`);
    }
    if (!fs.existsSync(path.join(BUILD, href.replace(/^\//, '')))) {
      problems.push(`[${rel}] PDF 目标不存在：${href}`);
    }
    if (!href.endsWith(fileName)) {
      problems.push(`[${rel}] download 属性与链接不一致：${fileName}`);
    }
  }
}

console.log(`文档页: ${docPages}`);
console.log(`编辑链接: ${editLinks} | PDF 链接: ${pdfLinks}`);
if (problems.length) {
  console.log(`异常: ${problems.length}`);
  for (const p of problems.slice(0, 10)) {
    console.log('  ✘ ' + p);
  }
  process.exit(1);
}
console.log('✔ 页脚动作行齐备，链接全部指向真实文件');
