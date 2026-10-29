import fs from 'node:fs';
import path from 'node:path';
import type {Config} from '@docusaurus/types';

// ─── 产品清单（3 条产品线 · 9 个产品，每产品一个 docs 实例）──────────────
type Product = {id: string; label: string; line: string};

const products: Product[] = [
  // 中间件产品线
  {id: 'aas', label: '金蝶Apusic应用服务器', line: 'middleware'},
  {id: 'admq', label: '金蝶Apusic分布式消息队列', line: 'middleware'},
  {id: 'adc', label: '金蝶Apusic分布式缓存', line: 'middleware'},
  {id: 'alb', label: '金蝶Apusic负载均衡器', line: 'middleware'},
  // 数据治理产品线
  {id: 'amdm', label: '金蝶Apusic主数据管理', line: 'data'},
  {id: 'adgp', label: '金蝶Apusic数据治理平台', line: 'data'},
  // AI 平台产品线
  {id: 'aig', label: '金蝶Apusic AI 网关', line: 'ai'},
  {id: 'akm', label: '金蝶Apusic知识库平台', line: 'ai'},
  {id: 'amem', label: '金蝶Apusic记忆平台', line: 'ai'},
];

const byLine = (line: string) =>
  products
    .filter((p) => p.line === line)
    .map((p) => ({label: p.label, to: `/${p.id}/intro`}));

// 文档页的「编辑此页」用 Docusaurus 原生能力：各 docs 实例配置 editUrl，
// 页脚由主题自带的 EditThisPage 渲染（i18n 文案内置：编辑此页 / 編輯此頁）。
// 用函数形式而不是字符串，因为本项目是多实例 + 冻结版 + i18n 三套目录：
// versionDocsDirPath 是文档源目录（products/<p>/docs 或 <p>_versioned_docs/version-x），
// docPath 是目录内的相对路径；翻译页要改的是 i18n 下的同构文件，缺翻译才回落到源文件。
const EDIT_BASE = 'https://github.com/magicluo0755/docs-center/edit/main';

function editUrl({
  versionDocsDirPath,
  docPath,
  locale,
}: {
  versionDocsDirPath: string;
  docPath: string;
  locale: string;
}): string {
  const candidates: string[] = [];
  if (locale !== 'zh-Hans') {
    // products/aas/docs              → 插件 aas、版本目录 current
    // aas_versioned_docs/version-1.0 → 插件 aas、版本目录 version-1.0
    const current = /^products\/([^/]+)\/docs$/.exec(versionDocsDirPath);
    const versioned = /^([^/]+)_versioned_docs\/(.+)$/.exec(versionDocsDirPath);
    const pluginId = current?.[1] ?? versioned?.[1];
    const versionDir = current ? 'current' : versioned?.[2];
    if (pluginId && versionDir) {
      candidates.push(
        `i18n/${locale}/docusaurus-plugin-content-docs-${pluginId}/${versionDir}/${docPath}`,
      );
    }
  }
  candidates.push(`${versionDocsDirPath}/${docPath}`);
  // 翻译缺失时回落到简体源文件（页面上回退显示的正是它，改它才对）
  const target =
    candidates.find((p) => fs.existsSync(path.join(__dirname, p))) ??
    candidates[candidates.length - 1];
  return `${EDIT_BASE}/${target}`;
}

// 每个产品挂载一个独立的 docs 插件实例：
// 独立路由前缀 / 独立 sidebar / 独立版本集（当前 V2.0 + 冻结版 V1.0）
const docPlugins: any = products.map((p) => [
  '@docusaurus/plugin-content-docs',
  {
    id: p.id,
    path: `products/${p.id}/docs`,
    routeBasePath: p.id,
    sidebarPath: require.resolve(`./products/${p.id}/sidebars.ts`),
    editUrl,
    versions: {
      current: {label: 'V2.0', path: '', banner: 'none'},
      '1.0': {label: 'V1.0', path: '1.0', banner: 'none'},
    },
    // 版本保留策略：versions.json 中仅保留最近 2 个版本，过期版本归档至 Git tag
  },
]);

const config: Config = {
  title: 'Apusic 产品文档中心',
  tagline: '多产品 · 多版本 · 多语言 一体化文档平台',
  url: 'http://localhost:3000',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/logo.svg',
  organizationName: 'Apusic',
  projectName: 'docs-center',

  // 多语言：默认简体中文；英文、繁体中文翻译位于 i18n/<locale>/
  // 繁体文档由 scripts/generate_hant.py 从简体源派生（OpenCC s2t，幂等可重跑）
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans', 'zh-Hant', 'en'],
    localeConfigs: {
      'zh-Hans': {label: '简体中文'},
      'zh-Hant': {label: '繁體中文'},
      en: {label: 'English'},
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      {
        docs: false, // 关闭默认 docs，改用多实例插件
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],

  plugins: docPlugins,

  // 离线全文搜索（内网可用，支持中/英文分词），覆盖全部产品/版本/语言
  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      /** @type {import('@easyops-cn/docusaurus-search-local').PluginOptions} */
      {
        hashed: true,
        language: ['en', 'zh'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        // 多实例场景必填：为非文档页（首页/search/404）的
        // useActiveVersion 钩子指定一个真实存在的 docs 插件 id
        docsPluginIdForPreferredVersion: 'aas',
        // 关键修复：多实例 routeBasePath 非默认 "docs" 时必须显式声明，
        // 否则 postBuild 的 processDocInfos 匹配不到任何文档路由，索引为空
        docsRouteBasePath: ['aas', 'admq', 'adc', 'alb', 'amdm', 'adgp', 'aig', 'akm', 'amem'],
      },
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'light',
    },
    // 桌面端文档侧边栏可整体收起/展开，便于专注阅读正文（Docusaurus 原生能力）：
    // 主题负责渲染「收起侧边栏」按钮 + 收起后的悬浮「展开侧边栏」箭头，
    // 文案与图标均为内置（三语齐备）。移动端不受影响，仍走原生抽屉。
    docs: {
      sidebar: {
        hideable: true,
      },
    },
    navbar: {
      title: '文档中心',
      logo: {alt: 'Apusic', src: 'img/apusic-logo-mark.png'},
      items: [
        {to: '/', label: '首页', position: 'left'},
        {label: '中间件', type: 'dropdown', position: 'left', items: byLine('middleware')},
        {label: '数据治理', type: 'dropdown', position: 'left', items: byLine('data')},
        {label: 'AI 平台', type: 'dropdown', position: 'left', items: byLine('ai')},
        {type: 'localeDropdown', position: 'right'},
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Apusic 产品文档中心`,
    },
  },
};

export default config;
