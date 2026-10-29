#!/usr/bin/env node
/**
 * 把 PDF 出稿产物同步进站点静态目录：output/pdf/** → static/downloads/pdf/**
 *
 * 为什么需要：PDF 由 scripts/pdf/release-all.js 单独产出（不进 git），而站点是纯静态托管，
 * 浏览器要能直接 GET 到 /downloads/pdf/...。构建前同步一次，产物随手部署即可自包含。
 *
 * 策略：逐个文件增量复制（大小不同才覆盖），并清理源端已不存在的旧文件，
 *      避免删目录造成的批量删除风险。
 *
 * 用法：node scripts/pdf/sync-assets.js [--quiet]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'output/pdf');
const DEST = path.join(ROOT, 'static/downloads/pdf');

function walk(dir, base = dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, {withFileTypes: true});
  } catch (e) {
    return out;
  }
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(abs, base, out);
    } else if (entry.isFile()) {
      out.push(path.relative(base, abs));
    }
  }
  return out;
}

function sync() {
  if (!fs.existsSync(SRC)) {
    return {copied: 0, removed: 0, skipped: true};
  }

  const srcFiles = walk(SRC).filter((f) => f.toLowerCase().endsWith('.pdf'));
  const wanted = new Set(srcFiles.map((f) => f.split(path.sep).join('/')));
  let copied = 0;

  for (const rel of srcFiles) {
    const from = path.join(SRC, rel);
    const to = path.join(DEST, rel);
    const srcStat = fs.statSync(from);

    let needCopy = true;
    try {
      const destStat = fs.statSync(to);
      needCopy = destStat.size !== srcStat.size;
    } catch (e) {
      needCopy = true;
    }

    if (needCopy) {
      fs.mkdirSync(path.dirname(to), {recursive: true});
      fs.copyFileSync(from, to);
      copied += 1;
    }
  }

  // 清理目标端多余文件（源端已删除的旧产物）
  let removed = 0;
  for (const rel of walk(DEST)) {
    const key = rel.split(path.sep).join('/');
    if (!wanted.has(key)) {
      try {
        fs.unlinkSync(path.join(DEST, rel));
        removed += 1;
      } catch (e) {
        /* 文件被占用时忽略，下次同步再清 */
      }
    }
  }

  return {copied, removed, total: srcFiles.length, skipped: false};
}

if (require.main === module) {
  const quiet = process.argv.includes('--quiet');
  const r = sync();
  if (!quiet) {
    if (r.skipped) {
      console.log('[pdf-assets] 未找到 output/pdf，跳过同步（站点将不提供 PDF 下载）');
    } else {
      console.log(
        `[pdf-assets] ${r.total} 份 PDF → static/downloads/pdf（新复制 ${r.copied}，清理 ${r.removed}）`,
      );
    }
  }
}

module.exports = {sync};
