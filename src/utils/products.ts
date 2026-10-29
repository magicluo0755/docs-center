// 产品元数据：产品 id → 简称/全称（zh-Hans / zh-Hant / en 三套）
// 与 docusaurus.config.ts 中 docs 插件 id、scripts/pdf 配置保持一致
// 命名规范：中文名 = 金蝶Apusic + 产品名；英文名 = Apusic + 产品名；short = 对外简称
// 注意：内部路由 id 保持稳定（adc 的对外简称已更改为 AMDC，但路由仍为 /adc/）
export type Locale = 'zh-Hans' | 'zh-Hant' | 'en';

export type ProductInfo = {
  id: string;
  short: string; // 对外简称（AAS/AMDC/…）
  zh: string; // 中文全称，如「金蝶Apusic应用服务器」
  hant: string;
  en: string; // 英文全称，如「Apusic Application Server」
  lineZh: string;
  lineHant: string;
  lineEn: string;
};

export const PRODUCTS: ProductInfo[] = [
  // 中间件
  {id: 'aas', short: 'AAS', zh: '金蝶Apusic应用服务器', hant: '金蝶Apusic應用服務器', en: 'Apusic Application Server', lineZh: '中间件', lineHant: '中間件', lineEn: 'Middleware'},
  {id: 'admq', short: 'ADMQ', zh: '金蝶Apusic分布式消息队列', hant: '金蝶Apusic分佈式消息隊列', en: 'Apusic Distributed Message Queue', lineZh: '中间件', lineHant: '中間件', lineEn: 'Middleware'},
  {id: 'adc', short: 'AMDC', zh: '金蝶Apusic分布式缓存', hant: '金蝶Apusic分佈式緩存', en: 'Apusic Memory Data in Cache', lineZh: '中间件', lineHant: '中間件', lineEn: 'Middleware'},
  {id: 'alb', short: 'ALB', zh: '金蝶Apusic负载均衡器', hant: '金蝶Apusic負載均衡器', en: 'Apusic Load Balancer', lineZh: '中间件', lineHant: '中間件', lineEn: 'Middleware'},
  // 数据治理
  {id: 'amdm', short: 'AMDM', zh: '金蝶Apusic主数据管理', hant: '金蝶Apusic主數據管理', en: 'Apusic Master Data Management', lineZh: '数据治理', lineHant: '數據治理', lineEn: 'Data Governance'},
  {id: 'adgp', short: 'ADGP', zh: '金蝶Apusic数据治理平台', hant: '金蝶Apusic數據治理平臺', en: 'Apusic Data Governance Platform', lineZh: '数据治理', lineHant: '數據治理', lineEn: 'Data Governance'},
  // AI 平台
  {id: 'aig', short: 'AIG', zh: '金蝶Apusic AI 网关', hant: '金蝶Apusic AI 網關', en: 'Apusic AI Gateway', lineZh: 'AI 平台', lineHant: 'AI 平臺', lineEn: 'AI Platform'},
  {id: 'akm', short: 'AKM', zh: '金蝶Apusic知识库平台', hant: '金蝶Apusic知識庫平臺', en: 'Apusic Knowledge Management', lineZh: 'AI 平台', lineHant: 'AI 平臺', lineEn: 'AI Platform'},
  {id: 'amem', short: 'AMEM', zh: '金蝶Apusic记忆平台', hant: '金蝶Apusic記憶平臺', en: 'Apusic Memory Platform', lineZh: 'AI 平台', lineHant: 'AI 平臺', lineEn: 'AI Platform'},
];

/** 按 locale 取产品名（全称） */
export function productName(p: ProductInfo, locale: Locale): string {
  return locale === 'en' ? p.en : locale === 'zh-Hant' ? p.hant : p.zh;
}

/** 按 locale 取产品线名 */
export function productLine(p: ProductInfo, locale: Locale): string {
  return locale === 'en' ? p.lineEn : locale === 'zh-Hant' ? p.lineHant : p.lineZh;
}

/** locale → URL 前缀（默认 locale 无前缀） */
export function localePrefix(locale: Locale): string {
  return locale === 'zh-Hans' ? '' : `/${locale}`;
}

/** 从站点路径解析当前 locale（默认 zh-Hans） */
export function localeFromPath(pathname: string): Locale {
  if (/^\/en(\/|$)/.test(pathname)) {
    return 'en';
  }
  if (/^\/zh-Hant(\/|$)/.test(pathname)) {
    return 'zh-Hant';
  }
  return 'zh-Hans';
}

/** 从站点路径解析产品上下文（兼容 locale 前缀与版本路径段） */
export function resolveProductContext(
  pathname: string,
): {product: ProductInfo; versionLabel: string} | null {
  // 去掉 locale 前缀
  const stripped = pathname.replace(/^\/(en|zh-Hans|zh-Hant)(\/|$)/, '/');
  const product = PRODUCTS.find(
    (p) => stripped === `/${p.id}` || stripped.startsWith(`/${p.id}/`),
  );
  if (!product) {
    return null;
  }
  // 版本段：/akm/1.0/... → V1.0；其余（根路径）为当前开发版 V2.0
  const rest = stripped.slice(product.id.length + 1); // "/akm" 之后的部分（含前导斜杠）
  const versionLabel =
    rest.startsWith('/1.0/') || rest === '/1.0' ? 'V1.0' : 'V2.0';
  return {product, versionLabel};
}

/**
 * 解析当前文档路由：产品 + 版本 + 页面 slug。
 * slug 是相对产品根、去掉版本段后的路径（无前导斜杠），
 * 与 scripts/pdf/manuals.json 中 docs 条目的写法一致：
 *   /aas/installation/standalone → installation/standalone
 *   /aas/1.0/intro               → intro
 *   /aas/                        → ''
 */
export function resolveDocRoute(
  pathname: string,
): {product: ProductInfo; versionLabel: string; slug: string} | null {
  const ctx = resolveProductContext(pathname);
  if (!ctx) {
    return null;
  }
  const stripped = pathname.replace(/^\/(en|zh-Hans|zh-Hant)(\/|$)/, '/');
  let rest = stripped.slice(ctx.product.id.length + 1); // '' 或 '/...'
  if (rest === '/1.0' || rest.startsWith('/1.0/')) {
    rest = rest.slice('/1.0'.length);
  }
  return {
    product: ctx.product,
    versionLabel: ctx.versionLabel,
    slug: rest.replace(/^\/+|\/+$/g, ''),
  };
}
