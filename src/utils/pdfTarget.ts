// PDF 目标选择：当前页面 → 该下载哪一份 PDF
// 数据来自构建期生成的 src/data/pdf-manifest.json（scripts/pdf/build-manifest.js）
import type {Locale} from './products';

export type PdfEntry = {file: string; href: string; bytes: number};
export type PdfMatcher = {type: 'exact' | 'dir'; value: string};
export type PdfManual = PdfEntry & {
  id: string;
  title: Partial<Record<'zh' | 'hant' | 'en', string>>;
  matchers: PdfMatcher[];
};
export type PdfLocaleEntry = {full: PdfEntry | null; manuals: PdfManual[]};

export type PdfManifest = {
  generatedAt: string;
  hrefPrefix: string;
  products: Record<string, Record<string, Record<string, PdfLocaleEntry>>>;
};

/** 页面 slug 是否落在这本手册的收录范围里 */
export function matchesManual(manual: PdfManual, slug: string): boolean {
  return manual.matchers.some((m) =>
    m.type === 'exact'
      ? slug === m.value
      : slug === m.value || slug.startsWith(`${m.value}/`),
  );
}

/**
 * 选定下载目标：
 *   1. 恰好命中一本分册 → 下这本分册（用户预期：安装页给安装手册）
 *   2. 命中多本（如 intro 被每本手册收录）或未命中 → 回退全量合集
 *   3. 无全量合集但仅有一本分册 → 下这本分册
 */
export function pickPdf(
  entry: PdfLocaleEntry | undefined,
  slug: string,
): {pdf: PdfEntry; manual?: PdfManual} | null {
  if (!entry) {
    return null;
  }
  const matched = entry.manuals.filter((m) => matchesManual(m, slug));
  if (matched.length === 1) {
    return {pdf: matched[0], manual: matched[0]};
  }
  if (entry.full) {
    return {pdf: entry.full};
  }
  if (entry.manuals.length === 1) {
    return {pdf: entry.manuals[0], manual: entry.manuals[0]};
  }
  return null;
}

/** 手册标题按语言取值 */
export function manualTitle(manual: PdfManual, locale: Locale): string {
  if (locale === 'en') {
    return manual.title.en || manual.id;
  }
  if (locale === 'zh-Hant') {
    return manual.title.hant || manual.title.zh || manual.id;
  }
  return manual.title.zh || manual.id;
}

/** 字节数 → 人类可读（MB 保留 1 位） */
export function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) {
    return '';
  }
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
