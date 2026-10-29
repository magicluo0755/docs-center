import React from 'react';
import {useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  localeFromPath,
  resolveDocRoute,
  type Locale,
} from '@site/src/utils/products';
import {
  formatSize,
  manualTitle,
  pickPdf,
  type PdfManifest,
} from '@site/src/utils/pdfTarget';
import manifest from '@site/src/data/pdf-manifest.json';
import styles from './styles.module.css';

const PDF_MANIFEST = manifest as unknown as PdfManifest;

const TEXTS: Record<Locale, {label: string; fullName: string; hint: (n: string, s: string) => string}> = {
  'zh-Hans': {
    label: '下载 PDF',
    fullName: '全量合集',
    hint: (name, size) => `下载「${name}」${size ? `（${size}）` : ''}`,
  },
  'zh-Hant': {
    label: '下載 PDF',
    fullName: '全量合集',
    hint: (name, size) => `下載「${name}」${size ? `（${size}）` : ''}`,
  },
  en: {
    label: 'Download PDF',
    fullName: 'Complete manual',
    hint: (name, size) => `Download "${name}"${size ? ` (${size})` : ''}`,
  },
};

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M4 21h16" />
    </svg>
  );
}

/**
 * 文档页脚「下载 PDF」链接，与原生「编辑此页」并排（见 src/theme/EditThisPage）。
 * 只下载当前页所属手册；该语言未出稿或路由无法判定时整项不渲染。
 */
export default function DownloadPdfLink(): React.ReactElement | null {
  const {pathname} = useLocation();
  // PDF 路径里已含语言目录（/downloads/pdf/<p>/<v>/<locale>/...），
  // 而 Docusaurus 在非默认语言构建时会把 locale 拼进 baseUrl（en 下为「/en/」），
  // 直接用会得到 /en/downloads/... 这种错链。这里剥掉 locale 段，只保留真实部署前缀。
  const {siteConfig} = useDocusaurusContext();
  const baseUrl = siteConfig.baseUrl
    .replace(/^\/(en|zh-Hant)\/?/, '/')
    .replace(/\/+$/, '');

  const locale = localeFromPath(pathname);
  const texts = TEXTS[locale];

  const route = resolveDocRoute(pathname);
  if (!route) {
    return null;
  }
  const entry =
    PDF_MANIFEST.products[route.product.id]?.[route.versionLabel]?.[locale];
  const target = pickPdf(entry, route.slug);
  if (!target) {
    return null;
  }

  const name = target.manual
    ? manualTitle(target.manual, locale)
    : texts.fullName;
  const hint = texts.hint(name, formatSize(target.pdf.bytes));

  return (
    <a
      className={styles.link}
      href={`${baseUrl}${target.pdf.href}`}
      download={target.pdf.file}
      title={hint}
      aria-label={hint}
      data-testid="doc-pdf-download"
      data-pdf-file={target.pdf.file}>
      <DownloadIcon />
      <span>{texts.label}</span>
    </a>
  );
}
