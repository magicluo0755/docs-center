#!/usr/bin/env node
/**
 * 生成 PDF 清单（src/data/pdf-manifest.json）
 *
 * 站点导航栏的「下载 PDF」按钮需要在**浏览器端**知道：
 *   1. 当前产品 / 版本 / 语言下到底有哪些 PDF（某些语言可能没出稿）；
 *   2. 当前页面属于哪一本手册（manuals.json 的分册组合）。
 * 这些信息只有构建期才知道，所以在构建前扫描 output/pdf + manuals.json 固化成 JSON。
 *
 * 目录约定：output/pdf/<product>/<version>/<locale>/<product>-<version>-<locale>[-<manualId>].pdf
 * 访问路径：/downloads/pdf/<product>/<version>/<locale>/<文件名>（由 scripts/pdf/sync-assets.js 同步进静态目录）
 *
 * 用法：node scripts/pdf/build-manifest.js [--quiet]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const PDF_ROOT = path.join(ROOT, 'output/pdf');
const MANUALS_FILE = path.join(__dirname, 'manuals.json');
const OUT_FILE = path.join(ROOT, 'src/data/pdf-manifest.json');
const PUBLIC_HREF_PREFIX = '/downloads/pdf';

function readManuals() {
  try {
    return JSON.parse(fs.readFileSync(MANUALS_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

/** manuals.json 的 docs 条目 → 匹配规则（exact = 单页，dir = 整棵目录） */
function toMatchers(docs) {
  if (!Array.isArray(docs)) return [];
  return docs.map((entry) =>
    typeof entry === 'string'
      ? {type: 'exact', value: entry.replace(/^\/+|\/+$/g, '')}
      : {type: 'dir', value: String(entry.dir || '').replace(/^\/+|\/+$/g, '')},
  ).filter((m) => m.value);
}

/**
 * 取某产品某版本的手册定义。
 * versions 支持 current / 1.0（manuals.json 惯用）与 V2.0 / V1.0（输出目录惯用）两种写法。
 */
function manualsFor(allManuals, product, version) {
  const conf = allManuals[product];
  if (!conf) return [];
  const normalized = version.startsWith('V') ? version.slice(1) : version;
  const override =
    (conf.versions && (conf.versions[version] || conf.versions[normalized])) || null;
  const list = override && Array.isArray(override.manuals) ? override.manuals : conf.manuals;
  return Array.isArray(list) ? list : [];
}

function safeDirs(dir) {
  try {
    return fs
      .readdirSync(dir, {withFileTypes: true})
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch (e) {
    return [];
  }
}

function safeFiles(dir) {
  try {
    return fs
      .readdirSync(dir, {withFileTypes: true})
      .filter((d) => d.isFile() && d.name.toLowerCase().endsWith('.pdf'))
      .map((d) => d.name);
  } catch (e) {
    return [];
  }
}

function build() {
  const allManuals = readManuals();
  const manifest = {
    generatedAt: new Date().toISOString(),
    hrefPrefix: PUBLIC_HREF_PREFIX,
    products: {},
  };

  let pdfCount = 0;

  for (const product of safeDirs(PDF_ROOT)) {
    for (const version of safeDirs(path.join(PDF_ROOT, product))) {
      for (const locale of safeDirs(path.join(PDF_ROOT, product, version))) {
        const dir = path.join(PDF_ROOT, product, version, locale);
        const prefix = `${product}-${version}-${locale}`;
        const files = safeFiles(dir);
        if (!files.length) continue;

        const byManual = new Map();
        let full = null;

        for (const file of files) {
          const stem = file.replace(/\.pdf$/i, '');
          if (!stem.startsWith(prefix)) continue;
          const suffix = stem.slice(prefix.length); // '' | '-installation-guide'
          const bytes = fs.statSync(path.join(dir, file)).size;
          const item = {
            file,
            href: `${PUBLIC_HREF_PREFIX}/${product}/${version}/${locale}/${file}`,
            bytes,
          };
          if (suffix === '') {
            full = item;
          } else if (suffix.startsWith('-')) {
            byManual.set(suffix.slice(1), item);
          }
          pdfCount += 1;
        }

        const manuals = manualsFor(allManuals, product, version)
          .map((m) => {
            const item = byManual.get(m.id);
            if (!item) return null; // 该语言未出这本分册（缺失翻译会整组跳过）
            return {
              id: m.id,
              title: m.title || {},
              file: item.file,
              href: item.href,
              bytes: item.bytes,
              matchers: toMatchers(m.docs),
            };
          })
          .filter(Boolean);

        if (!full && !manuals.length) continue;

        manifest.products[product] = manifest.products[product] || {};
        manifest.products[product][version] = manifest.products[product][version] || {};
        manifest.products[product][version][locale] = {full, manuals};
      }
    }
  }

  fs.mkdirSync(path.dirname(OUT_FILE), {recursive: true});
  fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  return {pdfCount, outFile: path.relative(ROOT, OUT_FILE)};
}

if (require.main === module) {
  const quiet = process.argv.includes('--quiet');
  try {
    const {pdfCount, outFile} = build();
    if (!quiet) {
      console.log(`[pdf-manifest] ${pdfCount} 份 PDF → ${outFile}`);
    }
  } catch (e) {
    console.error('[pdf-manifest] 生成失败：', e.message);
    process.exit(1);
  }
}

module.exports = {build};
